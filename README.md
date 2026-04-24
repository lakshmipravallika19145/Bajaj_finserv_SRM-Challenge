# SRM Full Stack Engineering Challenge

This project contains:
- `backend/` - Node.js + Express API (`POST /bfhl`)
- `frontend/` - Static HTML/CSS/JS UI to test and visualize API output

## API

### Endpoint
- `POST /bfhl`
- Content-Type: `application/json`

### Sample Request
```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

### Sample Response (shape)
```json
{
  "user_id": "lakshmi_pravallika",
  "email_id": "lakshmipravallika_kattamuri@srmap.edu.in",
  "college_roll_number": "AP23110011625",
  "hierarchies": [],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 0,
    "total_cycles": 0,
    "largest_tree_root": null
  }
}
```

## Local Setup

### 1) Backend
```bash
cd backend
npm install
node index.js
```

Backend runs on `http://localhost:3001`.

### 2) Frontend
Open:
- `frontend/index.html`

Set API URL in the UI to:
- `http://localhost:3001/bfhl`

## Test from PowerShell

```powershell
$body = @{
  data = @("A->B","A->C","B->D","X->Y","Y->Z","Z->X","hello","A->B")
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "http://localhost:3001/bfhl" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body | ConvertTo-Json -Depth 10
```

## Deployment

### Backend (Render)
- Root directory: `backend`
- Build command: `npm install`
- Start command: `node index.js`

### Frontend (Vercel / Netlify)
- Deploy `frontend/` as a static site
- Update frontend API URL to deployed backend URL + `/bfhl`

## Tech Stack
- Node.js
- Express
- CORS
- HTML/CSS/JavaScript
