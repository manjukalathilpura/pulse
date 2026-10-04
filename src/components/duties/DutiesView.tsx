import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DutyAssignment,
  DutyStatus,
  PriorityLevel,
} from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Navigation,
  CheckCircle,
  MessageSquare,
  Phone,
  Trash2,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { generateWhatsAppUrl } from '../../utils/commUtils';

export const DutiesView: React.FC = () => {
  const {
    role,
    currentStaff,
    dutiesList,
    createDuty,
    updateDutyStatus,
    deleteDuty,
    clientsList,
    staffList,
    addToast,
  } = useApp();

  // Filter & modal state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [completeDutyTarget, setCompleteDutyTarget] = useState<DutyAssignment | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');

  // Form state for new duty
  const [newDuty, setNewDuty] = useState({
    title: '',
    description: '',
    assignedStaffId: currentStaff.id,
    clientId: clientsList[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:30',
    endTime: '12:30',
    priority: 'medium' as PriorityLevel,
    siteAddress: clientsList[0]?.address || '',
    latitude: clientsList[0]?.latitude || 37.7749,
    longitude: clientsList[0]?.longitude || -122.4194,
  });

  const handleClientSelectChange = (clientId: string) => {
    const selected = clientsList.find((c) => c.id === clientId);
    if (selected) {
      setNewDuty((prev) => ({
        ...prev,
        clientId,
        siteAddress: selected.address,
        latitude: selected.latitude,
        longitude: selected.longitude,
      }));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDuty.title.trim()) {
      addToast('Please enter a duty title.', 'warning');
      return;
    }

    createDuty({
      title: newDuty.title,
      description: newDuty.description,
      assignedStaffId: newDuty.assignedStaffId,
      clientId: newDuty.clientId,
      date: newDuty.date,
      startTime: newDuty.startTime,
      endTime: newDuty.endTime,
      status: 'assigned',
      priority: newDuty.priority,
      siteAddress: newDuty.siteAddress,
      latitude: newDuty.latitude,
      longitude: newDuty.longitude,
    });

    setShowCreateModal(false);
    setNewDuty({
      title: '',
      description: '',
      assignedStaffId: currentStaff.id,
      clientId: clientsList[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:30',
      endTime: '12:30',
      priority: 'medium',
      siteAddress: clientsList[0]?.address || '',
      latitude: clientsList[0]?.latitude || 37.7749,
      longitude: clientsList[0]?.longitude || -122.4194,
    });
  };

  const handleFinishCompletion = () => {
    if (completeDutyTarget) {
      updateDutyStatus(completeDutyTarget.id, 'completed', completionNotes);
      setCompleteDutyTarget(null);
      setCompletionNotes('');
    }
  };

  // Filter duties based on role and filter
  const displayedDuties = dutiesList.filter((duty) => {
    const roleMatch = role === 'manager' || duty.assignedStaffId === currentStaff.id;
    const statusMatch = statusFilter === 'all' || duty.status === statusFilter;
    return roleMatch && statusMatch;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {role === 'field_staff' ? "My Assigned Duties" : "Field Duty Dispatch & Rostering"}
          </h2>
          <p className="text-xs text-slate-500">
            {role === 'field_staff'
              ? 'Today’s service schedules, client visits & on-site tasks'
              : 'Assign, dispatch, and track duty progress across all agents'}
          </p>
        </div>

        {role === 'manager' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Duty</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Duties' },
          { id: 'assigned', label: 'Assigned' },
          { id: 'en_route', label: 'En Route' },
          { id: 'on_site', label: 'On Site' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[32px] ${
              statusFilter === tab.id
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Duty Cards List */}
      {displayedDuties.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-500 space-y-2">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">No duties found</p>
          <p>
            {role === 'field_staff'
              ? "You don't have any assigned duties matching this filter."
              : 'Create a new duty assignment to dispatch tasks to field staff.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedDuties.map((duty) => {
            const client = clientsList.find((c) => c.id === duty.clientId);

            // WhatsApp link for arrival or dispatch
            const waUrl = client
              ? generateWhatsAppUrl(client.whatsappNumber, 'visit_scheduled', {
                  clientName: client.companyName,
                  contactPerson: client.contactPerson,
                  companyName: client.companyName,
                  staffName: duty.staffName,
                  dutyTitle: duty.title,
                  date: duty.date,
                })
              : '#';

            return (
              <div
                key={duty.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Header row: Client, Priority, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                      {duty.clientName}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{duty.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        duty.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : duty.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : duty.priority === 'medium'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {duty.priority}
                    </span>

                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                        duty.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : duty.status === 'on_site'
                          ? 'bg-purple-100 text-purple-800'
                          : duty.status === 'en_route'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {duty.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">{duty.description}</p>

                {/* Location & Time Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{duty.siteAddress}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {duty.date} · {duty.startTime} - {duty.endTime}
                    </span>
                  </div>
                </div>

                {/* Assigned Staff Name in Manager View */}
                {role === 'manager' && (
                  <div className="text-[11px] text-slate-500 font-medium">
                    Assigned Agent: <strong className="text-slate-800">{duty.staffName}</strong>
                  </div>
                )}

                {/* Completion Note if completed */}
                {duty.status === 'completed' && duty.completionNotes && (
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-emerald-900 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Duty Completed Notes
                    </span>
                    <p className="text-[11px]">{duty.completionNotes}</p>
                  </div>
                )}

                {/* Interactive Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  {/* Left: Quick Contact & Maps */}
                  <div className="flex items-center gap-1.5">
                    {/* Google Maps Directions */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${duty.latitude},${duty.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors min-h-[36px]"
                    >
                      <Navigation className="w-3 h-3 text-blue-600" />
                      <span>Directions</span>
                    </a>

                    {/* WhatsApp */}
                    {client && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors min-h-[36px]"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {/* Direct Call */}
                    {client && client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors min-h-[36px]"
                      >
                        <Phone className="w-3 h-3 text-slate-600" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    )}
                  </div>

                  {/* Right: Status Progression / Actions */}
                  <div className="flex items-center gap-2">
                    {duty.status === 'assigned' && (
                      <button
                        onClick={() => updateDutyStatus(duty.id, 'en_route')}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors min-h-[36px]"
                      >
                        Start Travel (En Route)
                      </button>
                    )}

                    {duty.status === 'en_route' && (
                      <button
                        onClick={() => updateDutyStatus(duty.id, 'on_site')}
                        className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors min-h-[36px]"
                      >
                        Arrived On Site
                      </button>
                    )}

                    {duty.status === 'on_site' && (
                      <button
                        onClick={() => setCompleteDutyTarget(duty)}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors min-h-[36px]"
                      >
                        Finish & Complete
                      </button>
                    )}

                    {role === 'manager' && (
                      <button
                        onClick={() => deleteDuty(duty.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Duty"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion Modal */}
      {completeDutyTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Complete Duty Assignment</h3>
              <button
                onClick={() => setCompleteDutyTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Wrapping up <strong>{completeDutyTarget.title}</strong> at {completeDutyTarget.clientName}.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Field Inspection / Work Notes:
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Sensors calibrated, tested pressure line, client manager signed work permit."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompleteDutyTarget(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinishCompletion}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Duty Modal (Manager) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Assign New Field Duty
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Client:</label>
                <select
                  value={newDuty.clientId}
                  onChange={(e) => handleClientSelectChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assign to Field Staff:</label>
                <select
                  value={newDuty.assignedStaffId}
                  onChange={(e) => setNewDuty((prev) => ({ ...prev, assignedStaffId: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Duty Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Semi-Annual HVAC Calibration & Safety Test"
                  value={newDuty.title}
                  onChange={(e) => setNewDuty((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Task Instructions:</label>
                <textarea
                  rows={2}
                  placeholder="Specific tasks, equipment needed, safety protocol..."
                  value={newDuty.description}
                  onChange={(e) => setNewDuty((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date:</label>
                  <input
                    type="date"
                    value={newDuty.date}
                    onChange={(e) => setNewDuty((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time:</label>
                  <input
                    type="time"
                    value={newDuty.startTime}
                    onChange={(e) => setNewDuty((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time:</label>
                  <input
                    type="time"
                    value={newDuty.endTime}
                    onChange={(e) => setNewDuty((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority:</label>
                  <select
                    value={newDuty.priority}
                    onChange={(e) =>
                      setNewDuty((prev) => ({ ...prev, priority: e.target.value as PriorityLevel }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Site Address:</label>
                  <input
                    type="text"
                    value={newDuty.siteAddress}
                    onChange={(e) => setNewDuty((prev) => ({ ...prev, siteAddress: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium truncate"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Dispatch Duty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
