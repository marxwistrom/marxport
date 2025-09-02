# Task Management System

Full-stack task management application with real-time updates, user roles, project collaboration, and deadline tracking. Features RESTful API design.

## 🎯 Project Overview

This project demonstrates a comprehensive task management system built with Django and modern web technologies. The application supports team collaboration, project organization, real-time updates, and advanced task tracking with role-based permissions.

## 🛠 Technologies Used

- **Backend**: Python Django
- **Database**: PostgreSQL
- **Cache**: Redis
- **Real-time**: WebSocket (Django Channels)
- **Authentication**: Django Auth + JWT
- **API**: Django REST Framework
- **Task Queue**: Celery

## ✨ Key Features

### User Management
- **Authentication**: Django-based user authentication
- **Role-Based Access**: Admin, Project Manager, Team Member roles
- **User Profiles**: Customizable user profiles and preferences
- **Team Management**: User invitation and team organization

### Project Organization
- **Project Creation**: Multi-project workspace support
- **Project Permissions**: Granular access control per project
- **Project Templates**: Reusable project structures
- **Project Analytics**: Progress tracking and reporting

### Task Management
- **Task CRUD**: Complete task lifecycle management
- **Task Assignment**: Multi-user task assignment
- **Priority Levels**: High, Medium, Low priority classification
- **Status Tracking**: Todo, In Progress, Review, Completed states
- **Due Dates**: Deadline management with notifications

### Real-time Collaboration
- **Live Updates**: WebSocket-based real-time synchronization
- **Activity Feed**: Real-time project activity notifications
- **Comments**: Task-level discussion threads
- **Notifications**: Email and in-app notification system

## 🏗 Architecture

### Backend Structure
```
task_management/
├── apps/
│   ├── users/          # User management
│   ├── projects/       # Project handling
│   ├── tasks/          # Task operations
│   ├── notifications/  # Notification system
│   └── websockets/     # Real-time features
├── api/               # REST API endpoints
├── settings/          # Django configuration
└── requirements.txt   # Dependencies
```

### Database Design
- **Users**: Extended Django user model
- **Projects**: Project organization and metadata
- **Tasks**: Core task entity with relationships
- **Comments**: Task discussion system
- **Notifications**: User notification tracking

## 🚀 Implementation Highlights

### RESTful API Design
```python
# Task ViewSet with full CRUD operations
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, TaskPermission]
    
    def get_queryset(self):
        return Task.objects.filter(
            project__members=self.request.user
        ).select_related('assignee', 'project')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        # Send real-time notification
        send_task_notification.delay(serializer.instance.id, 'created')
```

### Real-time WebSocket Integration
```python
# WebSocket consumer for real-time updates
class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.project_group_name = f'project_{self.project_id}'
        
        await self.channel_layer.group_add(
            self.project_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def task_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'task_update',
            'task': event['task_data']
        }))
```

### Advanced Task Filtering
```python
class TaskFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Task.STATUS_CHOICES)
    priority = django_filters.ChoiceFilter(choices=Task.PRIORITY_CHOICES)
    assignee = django_filters.ModelChoiceFilter(queryset=User.objects.all())
    due_date_range = django_filters.DateFromToRangeFilter(field_name='due_date')
    search = django_filters.CharFilter(method='filter_search')
    
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) | 
            Q(description__icontains=value) |
            Q(tags__name__icontains=value)
        ).distinct()
    
    class Meta:
        model = Task
        fields = ['status', 'priority', 'assignee', 'project']
```

## 📊 Database Models

### Task Model
```python
class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('review', 'In Review'),
        ('completed', 'Completed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    due_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Project Model
```python
class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects')
    members = models.ManyToManyField(User, through='ProjectMembership')
    created_at = models.DateTimeField(auto_now_add=True)
    deadline = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
```

## 🔄 Real-time Features

### WebSocket Channels
- **Task Updates**: Live task status changes
- **New Assignments**: Real-time task assignments
- **Comments**: Live discussion updates
- **Project Activity**: Real-time activity feed

### Notification System
```python
@shared_task
def send_task_notification(task_id, action):
    task = Task.objects.get(id=task_id)
    
    # Create in-app notification
    Notification.objects.create(
        user=task.assignee,
        title=f'Task {action}: {task.title}',
        message=f'Task has been {action} in project {task.project.name}',
        task=task
    )
    
    # Send WebSocket update
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{task.assignee.id}',
        {
            'type': 'notification_update',
            'notification': NotificationSerializer(notification).data
        }
    )
```

## 📈 Advanced Features

### Analytics Dashboard
- **Project Progress**: Visual progress tracking
- **Team Performance**: Individual and team metrics
- **Deadline Tracking**: Overdue task monitoring
- **Workload Distribution**: Task assignment balance

### API Endpoints
```python
# Key API endpoints
GET    /api/projects/                    # List user's projects
POST   /api/projects/                    # Create new project
GET    /api/projects/{id}/tasks/         # Get project tasks
POST   /api/tasks/                       # Create new task
PUT    /api/tasks/{id}/                  # Update task
DELETE /api/tasks/{id}/                  # Delete task
POST   /api/tasks/{id}/comments/         # Add task comment
GET    /api/notifications/               # Get user notifications
```

### Permission System
```python
class TaskPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Check if user is project member
        if not obj.project.members.filter(id=request.user.id).exists():
            return False
        
        # Project owners and task creators can modify
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return (obj.project.owner == request.user or 
                   obj.created_by == request.user or
                   obj.assignee == request.user)
        
        return True
```

## 🔒 Security Features

- **Authentication**: JWT token-based authentication
- **Authorization**: Role-based permissions
- **Input Validation**: Django form validation
- **CSRF Protection**: Built-in Django CSRF protection
- **SQL Injection Prevention**: Django ORM protection

## 📚 Learning Outcomes

This project demonstrates:
- **Full-stack Development**: Django backend with REST API
- **Real-time Applications**: WebSocket implementation
- **Database Design**: Complex relational database modeling
- **User Authentication**: Role-based access control
- **API Design**: RESTful API best practices
- **Task Queues**: Asynchronous task processing
- **Team Collaboration**: Multi-user application design

## 🔗 Repository

**GitHub**: [Task Management System](https://github.com/marxwistrom/task-manager)

---

*Part of Marx Wiström's Backend Development Portfolio*
