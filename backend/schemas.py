from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    creator_id: int

    class Config:
        from_attributes = True

class ProjectMemberResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    role: str
    user: UserResponse

    class Config:
        from_attributes = True

class ProjectWithMembersResponse(ProjectResponse):
    members: List[ProjectMemberResponse]

    class Config:
        from_attributes = True

class ProjectMemberCreate(BaseModel):
    email: EmailStr
    role: str = "member"

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = "Medium"
    status: str = "To Do"
    assignee_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    project_id: int
    creator_id: int
    assignee: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- Dashboard Schemas ---
class UserTaskCount(BaseModel):
    user_name: str
    task_count: int

class DashboardStats(BaseModel):
    total_tasks: int
    todo_tasks: int
    in_progress_tasks: int
    done_tasks: int
    overdue_tasks: int
    user_role: str
    tasks_per_user: List[UserTaskCount]
