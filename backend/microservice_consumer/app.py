import os
from base64 import b64encode
from typing import Dict, Any

import requests
from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)

BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8080')
BACKEND_USER = os.getenv('BACKEND_USER', 'admin')
BACKEND_PASS = os.getenv('BACKEND_PASS', 'admin123')


def auth_headers() -> Dict[str, str]:
    token = b64encode(f'{BACKEND_USER}:{BACKEND_PASS}'.encode()).decode()
    return {'Authorization': f'Basic {token}', 'Content-Type': 'application/json'}


def call_backend(method: str, path: str, payload: Dict[str, Any] | None = None):
    return requests.request(method, f'{BACKEND_URL}{path}', headers=auth_headers(), json=payload, timeout=30)


@app.get('/')
def home():
    return render_template('home.html', backend=BACKEND_URL, user=BACKEND_USER)


@app.get('/suppliers')
def suppliers():
    rows = call_backend('GET', '/api/data/suppliers').json()
    return render_template('entity.html', title='Suppliers', endpoint='/suppliers', rows=rows)


@app.post('/suppliers')
def suppliers_create():
    call_backend('POST', '/api/data/suppliers', {
        'name': request.form['name'],
        'taxId': request.form['taxId'],
        'email': request.form['email'],
        'phone': request.form['phone']
    })
    return redirect(url_for('suppliers'))


@app.get('/budget-lines')
def budget_lines():
    rows = call_backend('GET', '/api/data/budget-lines').json()
    return render_template('entity.html', title='Budget Lines', endpoint='/budget-lines', rows=rows)


@app.post('/budget-lines')
def budget_lines_create():
    call_backend('POST', '/api/data/budget-lines', {
        'code': request.form['code'],
        'description': request.form['description'],
        'allocatedAmount': request.form['allocatedAmount']
    })
    return redirect(url_for('budget_lines'))


@app.get('/departments')
def departments():
    rows = call_backend('GET', '/api/data/departments').json()
    return render_template('entity.html', title='Departments', endpoint='/departments', rows=rows)


@app.post('/departments')
def departments_create():
    call_backend('POST', '/api/data/departments', {
        'name': request.form['name'],
        'costCenterCode': request.form['costCenterCode']
    })
    return redirect(url_for('departments'))


@app.get('/employees')
def employees():
    rows = call_backend('GET', '/api/data/employees').json()
    departments = call_backend('GET', '/api/data/departments').json()
    return render_template('employees.html', rows=rows, departments=departments)


@app.post('/employees')
def employees_create():
    call_backend('POST', '/api/data/employees', {
        'fullName': request.form['fullName'],
        'email': request.form['email'],
        'departmentId': int(request.form['departmentId'])
    })
    return redirect(url_for('employees'))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)
