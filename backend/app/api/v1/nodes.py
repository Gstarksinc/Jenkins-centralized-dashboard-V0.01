import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.db.session import get_db
from app.models.node import Node
from app.models.server import JenkinsServer
from app.schemas.node import NodeResponse

router = APIRouter(prefix="/nodes", tags=["Nodes"])


@router.get("", response_model=List[NodeResponse])
def list_nodes(
    server_id: Optional[uuid.UUID] = None,
    online_only: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """List agent nodes across all registered controllers."""
    query = (
        select(Node, JenkinsServer.name.label("server_name"))
        .join(JenkinsServer, Node.server_id == JenkinsServer.id)
    )

    if server_id:
        query = query.where(Node.server_id == server_id)
    if online_only is not None:
        query = query.where(Node.is_online == online_only)

    query = query.order_by(Node.name.asc())
    rows = db.execute(query).all()

    result = []
    for node, server_name in rows:
        resp = NodeResponse.model_validate(node)
        resp.server_name = server_name
        result.append(resp)

    return result
