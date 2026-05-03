from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

import models, schemas
from dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"]
)

@router.get("/", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    project_id: int,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Check if user is member of this specific project
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this project's dashboard")
        
    user_role = membership.role

    # Base query for tasks in this project
    task_query = db.query(models.Task).filter(models.Task.project_id == project_id)

    # If user is a member (and not admin of the project), they only see THEIR tasks stats
    if user_role == "member":
        task_query = task_query.filter(models.Task.assignee_id == current_user.id)

    all_tasks = task_query.all()

    total_tasks = len(all_tasks)
    todo_tasks = sum(1 for task in all_tasks if task.status == "To Do")
    in_progress_tasks = sum(1 for task in all_tasks if task.status == "In Progress")
    done_tasks = sum(1 for task in all_tasks if task.status == "Done")
    
    now = datetime.utcnow()
    overdue_tasks = sum(1 for task in all_tasks if task.due_date and task.due_date < now and task.status != "Done")

    tasks_per_user = []
    if user_role == "admin":
        # Only admins see the per-user breakdown
        user_counts = {}
        for task in all_tasks:
            if task.assignee:
                name = task.assignee.name
                user_counts[name] = user_counts.get(name, 0) + 1
        
        tasks_per_user = [
            schemas.UserTaskCount(user_name=name, task_count=count)
            for name, count in user_counts.items()
        ]

    return schemas.DashboardStats(
        total_tasks=total_tasks,
        todo_tasks=todo_tasks,
        in_progress_tasks=in_progress_tasks,
        done_tasks=done_tasks,
        overdue_tasks=overdue_tasks,
        user_role=user_role,
        tasks_per_user=tasks_per_user
    )
