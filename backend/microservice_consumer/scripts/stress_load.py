import argparse
import base64
import requests


def headers(user: str, password: str):
    token = base64.b64encode(f"{user}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}", "Content-Type": "application/json"}


def post(url: str, payload: dict, h: dict):
    r = requests.post(url, json=payload, headers=h, timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"Error {r.status_code}: {r.text[:200]}")


def run_suppliers(base, h, total):
    for i in range(total):
        post(f"{base}/api/data/suppliers", {
            "name": f"Proveedor Stress {i}",
            "taxId": f"RFC-STRESS-{i:05d}",
            "email": f"prov{i}@stress.local",
            "phone": f"555-{10000+i}"
        }, h)


def run_budget_lines(base, h, total):
    for i in range(total):
        post(f"{base}/api/data/budget-lines", {
            "code": f"BL-STRESS-{i:05d}",
            "description": f"Partida stress {i}",
            "allocatedAmount": 1000 + i
        }, h)


def run_departments(base, h, total):
    for i in range(total):
        post(f"{base}/api/data/departments", {
            "name": f"Dept Stress {i}",
            "costCenterCode": f"CC-ST-{i:05d}"
        }, h)


def run_employees(base, h, total, department_id):
    post(f"{base}/api/data/employees", {
        "fullName": "GPT-5.3-Codex",
        "email": "gpt53codex@stress.local",
        "departmentId": department_id
    }, h)
    for i in range(total - 1):
        post(f"{base}/api/data/employees", {
            "fullName": f"Empleado Stress {i}",
            "email": f"emp{i}@stress.local",
            "departmentId": department_id
        }, h)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://localhost:8080')
    parser.add_argument('--user', default='admin')
    parser.add_argument('--password', default='admin123')
    parser.add_argument('--entity', required=True, choices=['suppliers', 'budget-lines', 'departments', 'employees'])
    parser.add_argument('--count', type=int, default=1000)
    parser.add_argument('--department-id', type=int, default=1)
    args = parser.parse_args()

    h = headers(args.user, args.password)
    if args.entity == 'suppliers':
        run_suppliers(args.base_url, h, args.count)
    elif args.entity == 'budget-lines':
        run_budget_lines(args.base_url, h, args.count)
    elif args.entity == 'departments':
        run_departments(args.base_url, h, args.count)
    elif args.entity == 'employees':
        run_employees(args.base_url, h, args.count, args.department_id)

    print(f"Carga finalizada: {args.entity} -> {args.count} registros")


if __name__ == '__main__':
    main()
