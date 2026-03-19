from flask import Blueprint, request, jsonify
from database import db
from models import Project, Deliverable
from .auth import token_required
from helpers import log_activity

project_bp = Blueprint('project', __name__)

@project_bp.route('/projects', methods=['GET'])
def get_projects():
    projects = Project.query.all()
    output = []
    for p in projects:
        deliverables = Deliverable.query.filter_by(project_id=p.id).all()
        del_list = [{'id': d.id, 'title': d.title, 'status': d.status, 'due_date': str(d.due_date) if d.due_date else None} for d in deliverables]
        output.append({
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'start_date': str(p.start_date) if p.start_date else None,
            'end_date': str(p.end_date) if p.end_date else None,
            'status': p.status,
            'budget': p.budget,
            'deliverables': del_list
        })
    return jsonify(output)

@project_bp.route('/projects', methods=['POST'])
@token_required
def add_project(current_user):
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Project name is required'}), 400
    new_project = Project(
        name=name,
        description=data.get('description'),
        start_date=data.get('start_date') or None,
        end_date=data.get('end_date') or None,
        budget=data.get('budget', 0.0),
        status=data.get('status', 'Planned')
    )
    try:
        db.session.add(new_project)
        db.session.commit()
        log_activity(current_user.id, "ADD_PROJECT", f"Created project: {name}")
        return jsonify({'message': 'Project created', 'id': new_project.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@project_bp.route('/projects/<int:id>', methods=['PUT'])
@token_required
def update_project(current_user, id):
    p = Project.query.get(id)
    if not p:
        return jsonify({'error': 'Project not found'}), 404
    data = request.get_json()
    p.name = data.get('name', p.name)
    p.description = data.get('description', p.description)
    p.status = data.get('status', p.status)
    p.budget = data.get('budget', p.budget)
    p.start_date = data.get('start_date') or p.start_date
    p.end_date = data.get('end_date') or p.end_date
    try:
        db.session.commit()
        log_activity(current_user.id, "UPDATE_PROJECT", f"Updated project: {p.name}")
        return jsonify({'message': 'Project updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@project_bp.route('/projects/<int:id>', methods=['DELETE'])
@token_required
def delete_project(current_user, id):
    p = Project.query.get(id)
    if not p:
        return jsonify({'error': 'Project not found'}), 404
    try:
        name = p.name
        # Delete deliverables first
        Deliverable.query.filter_by(project_id=id).delete()
        db.session.delete(p)
        db.session.commit()
        log_activity(current_user.id, "DELETE_PROJECT", f"Deleted project: {name}")
        return jsonify({'message': 'Project deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@project_bp.route('/projects/<int:id>/deliverables', methods=['POST'])
@token_required
def add_deliverable(current_user, id):
    data = request.get_json()
    title = data.get('title')
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    new_del = Deliverable(
        project_id=id,
        title=title,
        due_date=data.get('due_date') or None,
        status='Pending'
    )
    try:
        db.session.add(new_del)
        db.session.commit()
        return jsonify({'message': 'Deliverable added', 'id': new_del.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@project_bp.route('/deliverables/<int:id>', methods=['PUT'])
@token_required
def update_deliverable(current_user, id):
    d = Deliverable.query.get(id)
    if not d:
        return jsonify({'message': 'Deliverable not found'}), 404
    data = request.get_json()
    if 'status' in data:
        d.status = data['status']
    if 'title' in data:
        d.title = data['title']
    try:
        db.session.commit()
        return jsonify({'message': 'Deliverable updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
