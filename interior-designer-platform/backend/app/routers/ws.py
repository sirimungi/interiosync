from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..ws_manager import ws_manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo/broadcast so all clients get live updates (e.g. from one client's action)
            await ws_manager.broadcast({"type": "raw", "data": data})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
