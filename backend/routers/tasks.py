from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/api",
    tags=["tasks"]
)

@router.get("/projects/{project_id}/tasks", response_model=List[schemas.TaskResponse])
def get_tasks_for_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to access this project's tasks")
    
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    return tasks

@router.post("/projects/{project_id}/tasks", response_model=schemas.TaskResponse)
def create_task(project_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Only Admin can create tasks
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not member or member.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create tasks")

    if task.assignee_id:
        assignee_member = db.query(models.ProjectMember).filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.user_id == task.assignee_id
        ).first()
        if not assignee_member:
            raise HTTPException(status_code=400, detail="Assignee is not a member of the project")

    new_task = models.Task(**task.model_dump(), project_id=project_id, creator_id=current_user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.put("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == db_task.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to modify this task")

    update_data = task_update.model_dump(exclude_unset=True)

    if member.role == "admin":
        # Admin can update everything
        if "assignee_id" in update_data and update_data["assignee_id"] is not None:
             assignee_member = db.query(models.ProjectMember).filter(
                models.ProjectMember.project_id == db_task.project_id,
                models.ProjectMember.user_id == update_data["assignee_id"]
             ).first()
             if not assignee_member:
                raise HTTPException(status_code=400, detail="New assignee is not a member of the project")
        
        for key, value in update_data.items():
            setattr(db_task, key, value)
    else:
        if "assignee_id" in update_data:
            raise HTTPException(status_code=403, detail="Only admin can assign tasks")
            
        # Member can only update status of their OWN tasks
        if db_task.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only update your assigned tasks")
        
        # Check if they are trying to update fields other than status
        allowed_keys = {"status"}
        if not set(update_data.keys()).issubset(allowed_keys):
            raise HTTPException(status_code=403, detail="Members can only update the status of their tasks")
        
        db_task.status = update_data["status"]

    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == db_task.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()

    if not member or member.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete tasks")

    db.delete(db_task)
    db.commit()
    return {"detail": "Task deleted successfully"}
