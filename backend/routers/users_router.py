from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, AuditLog
from auth import get_current_user, require_roles, hash_password
from schemas import UserOut, UserCreate

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/", response_model=list[UserOut])
def list_users(
    user: User = Depends(require_roles("SUPER_ADMIN", "ZONAL_ADMIN")),
    db: Session = Depends(get_db),
):
    if user.role == "ZONAL_ADMIN":
        return db.query(User).filter(User.zone == user.zone).all()
    return db.query(User).all()


@router.post("/", response_model=UserOut)
def create_user(
    req: UserCreate,
    user: User = Depends(require_roles("SUPER_ADMIN", "ZONAL_ADMIN")),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")

    new_user = User(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
        department=req.department,
        zone=req.zone,
        division=req.division,
        assigned_sections=req.assigned_sections,
    )
    db.add(new_user)
    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action="CREATE_USER", entity_type="USER", entity_id=new_user.id,
        details={"role": req.role, "email": req.email},
    ))
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    updates: dict,
    user: User = Depends(require_roles("SUPER_ADMIN", "ZONAL_ADMIN")),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    allowed = {"role", "department", "zone", "division", "assigned_sections", "mfa_enabled"}
    for key, value in updates.items():
        if key in allowed:
            setattr(target, key, value)

    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action="UPDATE_USER", entity_type="USER", entity_id=user_id,
        details=updates,
    ))
    db.commit()
    db.refresh(target)
    return target
