import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, UserPlus, Users, Trash2, Shield, User, ArrowLeft, Edit3, CheckCircle2, ListTodo, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); 

  const [newTask, setNewTask] = useState({
    title: '', description: '', due_date: '', priority: 'Medium', assignee_email: ''
  });
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const fetchProjectAndTasks = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/projects/${id}/tasks`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      toast.error('Failed to load project details');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const currentMembership = project?.members.find(m => m.user_id === user.id);
  const isAdmin = currentMembership?.role === 'admin';

  const openCreateModal = () => {
    if (!isAdmin) return;
    setSelectedTask(null);
    setNewTask({ title: '', description: '', due_date: '', priority: 'Medium', assignee_email: '' });
    setShowTaskModal(true);
  };

  const openEditModal = (task) => {
    // Only admin can edit full details. Members can't open this modal.
    if (!isAdmin) return;
    setSelectedTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      priority: task.priority,
      assignee_email: task.assignee?.email || ''
    });
    setShowTaskModal(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      let assignee_id = null;
      if (newTask.assignee_email) {
        const member = project.members.find(m => m.user.email === newTask.assignee_email);
        if (member) assignee_id = member.user.id;
        else {
          toast.error("User is not a member of this project");
          return;
        }
      }

      const taskData = {
        ...newTask,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
        assignee_id
      };

      if (selectedTask) {
        await api.put(`/api/tasks/${selectedTask.id}`, taskData);
        toast.success('Task updated');
      } else {
        await api.post(`/api/projects/${id}/tasks`, taskData);
        toast.success('Task created');
      }
      
      setShowTaskModal(false);
      fetchProjectAndTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
      fetchProjectAndTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unauthorized action');
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => t.id === parseInt(draggableId));
    
    // Member check: can only update status of assigned tasks
    if (!isAdmin && task.assignee_id !== user.id) {
      toast.error("You can only move tasks assigned to you");
      return;
    }

    const newStatus = destination.droppableId;
    updateTaskStatus(task.id, newStatus);
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchProjectAndTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await api.post(`/api/projects/${id}/members`, { email: newMemberEmail, role: 'member' });
      setNewMemberEmail('');
      toast.success('Member added');
      fetchProjectAndTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add member');
    }
  };

  if (loading) return <div className="animate-pulse space-y-8"><div className="h-20 bg-secondary/30 rounded-xl"></div><div className="grid grid-cols-3 gap-6 h-[60vh]"><div className="bg-secondary/20 rounded-2xl"></div><div className="bg-secondary/20 rounded-2xl"></div><div className="bg-secondary/20 rounded-2xl"></div></div></div>;
  if (!project) return null;

  const columns = ['To Do', 'In Progress', 'Done'];
  const getPriorityColor = (p) => p === 'High' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' : p === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <Link to="/projects" className="text-primary text-xs flex items-center mb-2 hover:underline opacity-80">
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${isAdmin ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary/50 text-muted-foreground border-border'}`}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{project.description}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowMembersModal(true)} className="glass-panel px-4 py-2 flex items-center text-sm font-medium hover:bg-secondary transition-colors border-border/50">
            <Users className="h-4 w-4 mr-2" /> Team ({project.members.length})
          </button>
          {isAdmin && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openCreateModal} className="bg-primary text-white px-5 py-2 rounded-xl shadow-lg shadow-primary/20 flex items-center font-medium">
              <Plus className="h-5 w-5 mr-1" /> New Task
            </motion.button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full min-w-max">
            {columns.map(status => (
              <div key={status} className="w-[350px] flex flex-col bg-secondary/10 rounded-2xl border border-border/30">
                <div className="p-4 border-b border-border/30 flex justify-between items-center bg-card/20 backdrop-blur-md rounded-t-2xl">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {status === 'To Do' && <ListTodo className="h-4 w-4 text-muted-foreground" />}
                    {status === 'In Progress' && <Activity className="h-4 w-4 text-blue-400" />}
                    {status === 'Done' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    {status} 
                    <span className="ml-1 text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === status).length}</span>
                  </h3>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 p-4 space-y-4 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}>
                      {tasks.filter(t => t.status === status).map((task, index) => {
                        const isAssignedToMe = task.assignee_id === user.id;
                        const canModify = isAdmin || isAssignedToMe;
                        
                        return (
                          <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index} isDragDisabled={!canModify}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef} 
                                {...provided.draggableProps} 
                                {...provided.dragHandleProps} 
                                onClick={() => isAdmin && openEditModal(task)}
                                className={`glass-card p-4 group ${isAdmin ? 'cursor-pointer' : isAssignedToMe ? 'cursor-grab' : 'cursor-default opacity-80'} ${snapshot.isDragging ? 'rotate-2 scale-105 border-primary/50 shadow-2xl' : ''}`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[9px] uppercase tracking-tighter font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                  {isAdmin && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => { e.stopPropagation(); openEditModal(task); }} className="text-muted-foreground hover:text-primary p-1"><Edit3 className="h-3.5 w-3.5" /></button>
                                      <button onClick={(e) => handleDeleteTask(task.id, e)} className="text-muted-foreground hover:text-rose-500 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                  )}
                                </div>
                                <h4 className="font-medium text-sm text-foreground mb-1 group-hover:text-primary transition-colors">{task.title}</h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                                
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/30 pt-3">
                                  <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                                  {task.assignee ? (
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${isAssignedToMe ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-secondary/50'}`}>
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">{task.assignee.name.charAt(0)}</div>
                                      <span className="truncate max-w-[70px]">{isAssignedToMe ? 'Me' : task.assignee.name}</span>
                                    </div>
                                  ) : (
                                    <span className="italic opacity-50">Unassigned</span>
                                  )}
                                </div>

                                {/* Mobile/Quick Status Switcher for Members */}
                                {!isAdmin && isAssignedToMe && (
                                  <div className="mt-3 grid grid-cols-3 gap-2">
                                    {columns.filter(s => s !== status).map(s => (
                                      <button 
                                        key={s} 
                                        onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, s); }}
                                        className="py-1 text-[8px] font-bold bg-secondary/50 hover:bg-primary/20 rounded border border-border transition-colors uppercase tracking-wider"
                                      >
                                        Move to {s}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Admin Task Modal */}
      <AnimatePresence>
        {showTaskModal && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel w-full max-w-lg p-6 relative shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{selectedTask ? 'Edit Task' : 'New Task'}</h3>
                <button onClick={() => setShowTaskModal(false)}><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSubmitTask} className="space-y-4">
                <input required placeholder="Task Title" className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm focus:ring-1 ring-primary" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                <textarea placeholder="Description" className="w-full bg-secondary/50 border border-border rounded-xl p-3 h-24 text-sm" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Due Date</label>
                    <input type="date" className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm [color-scheme:dark]" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Priority</label>
                    <select className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                      <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Assignment (Email)</label>
                  <input type="email" placeholder="member@example.com" className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm" value={newTask.assignee_email} onChange={e => setNewTask({...newTask, assignee_email: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-sm">Cancel</button><button type="submit" className="bg-primary px-6 py-2 rounded-xl text-white text-sm font-bold shadow-lg shadow-primary/20">{selectedTask ? 'Save Changes' : 'Create Task'}</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Members Modal */}
      <AnimatePresence>
        {showMembersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel w-full max-w-md p-6 relative shadow-2xl">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold flex items-center"><Users className="h-5 w-5 mr-2 text-primary" /> Team Members</h3><button onClick={() => setShowMembersModal(false)}><X className="h-5 w-5" /></button></div>
              {isAdmin && (
                <form onSubmit={handleAddMember} className="mb-6 flex gap-2">
                  <input required type="email" placeholder="Email Address" className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} />
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold">Add Member</button>
                </form>
              )}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {project.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">{member.user.name.charAt(0)}</div>
                      <div><p className="text-sm font-medium">{member.user.name}</p><p className="text-[10px] text-muted-foreground">{member.user.email}</p></div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${member.role === 'admin' ? 'text-primary border-primary/30 bg-primary/10' : 'text-muted-foreground border-border bg-secondary/50'}`}>{member.role}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetails;
