from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)

@router.get("/", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get all projects the user is a member of
    projects = db.query(models.Project).join(models.ProjectMember).filter(
        models.ProjectMember.user_id == current_user.id
    ).distinct().all()
    return projects

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_project = models.Project(**project.model_dump(), creator_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Add creator as admin
    project_member = models.ProjectMember(project_id=new_project.id, user_id=current_user.id, role="admin")
    db.add(project_member)
    db.commit()

    return new_project

@router.get("/{project_id}", response_model=schemas.ProjectWithMembersResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check access
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project

@router.post("/{project_id}/members", response_model=schemas.ProjectMemberResponse)
def add_member(project_id: int, member_data: schemas.ProjectMemberCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if current user is admin of the project
    admin_check = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id,
        models.ProjectMember.role == "admin"
    ).first()

    if not admin_check:
        raise HTTPException(status_code=403, detail="Only admins can add members")

    # Find user to add by email
    user_to_add = db.query(models.User).filter(models.User.email == member_data.email).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User with this email not found")

    # Check if already a member
    existing_member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_to_add.id
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this project")

    new_member = models.ProjectMember(project_id=project_id, user_id=user_to_add.id, role=member_data.role)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return new_member

@router.delete("/{project_id}/members/{user_id}")
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if current user is admin
    admin_check = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id,
        models.ProjectMember.role == "admin"
    ).first()

    if not admin_check:
        raise HTTPException(status_code=403, detail="Only admins can remove members")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot remove themselves. Delete project instead.")

    member_to_remove = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_id
    ).first()

    if not member_to_remove:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member_to_remove)
    db.commit()
    return {"detail": "Member removed successfully"}

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if current user is admin (or creator)
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project creator can delete the project")

    db.delete(project)
    db.commit()
    return {"detail": "Project deleted successfully"}
