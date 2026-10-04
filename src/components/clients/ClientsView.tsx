import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientStage, FollowUpNote } from '../../types';
import {
  Users,
  Plus,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Send,
  X,
  MapPin,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  generateWhatsAppUrl,
  generateMailtoUrl,
  getWhatsAppTemplateText,
  TemplateType,
} from '../../utils/commUtils';
import { BiometricGuard } from '../biometrics/BiometricGuard';

export const ClientsView: React.FC = () => {
  const {
    clientsList,
    createClient,
    updateClient,
    logFollowUp,
    staffList,
    currentStaff,
    role,
    addToast,
  } = useApp();

  // Filters & selection
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClientForLog, setSelectedClientForLog] = useState<Client | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);
  const [activeTemplateModalClient, setActiveTemplateModalClient] = useState<Client | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('quote_followup');

  // Follow up form state
  const [followUpChannel, setFollowUpChannel] = useState<'whatsapp' | 'email' | 'call' | 'visit'>('whatsapp');
  const [followUpSummary, setFollowUpSummary] = useState('');
  const [nextActionDate, setNextActionDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    return nextWeek.toISOString().split('T')[0];
  });

  // Add client form state
  const [newClient, setNewClient] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    latitude: 37.7749,
    longitude: -122.4194,
    stage: 'lead' as ClientStage,
    nextFollowUpDate: new Date().toISOString().split('T')[0],
    notes: '',
    assignedStaffId: currentStaff.id,
    dealValue: 10000,
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Overdue followups
  const overdueClients = clientsList.filter(
    (c) => c.nextFollowUpDate && c.nextFollowUpDate < todayStr
  );

  // Due today followups
  const dueTodayClients = clientsList.filter(
    (c) => c.nextFollowUpDate && c.nextFollowUpDate === todayStr
  );

  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.companyName.trim() || !newClient.contactPerson.trim()) {
      addToast('Please enter both company name and primary contact person.', 'warning');
      return;
    }

    createClient({
      companyName: newClient.companyName,
      contactPerson: newClient.contactPerson,
      email: newClient.email,
      phone: newClient.phone,
      whatsappNumber: newClient.whatsappNumber || newClient.phone,
      address: newClient.address || 'San Francisco, CA',
      latitude: newClient.latitude,
      longitude: newClient.longitude,
      stage: newClient.stage,
      lastContactDate: todayStr,
      nextFollowUpDate: newClient.nextFollowUpDate,
      notes: newClient.notes,
      assignedStaffId: newClient.assignedStaffId,
      dealValue: Number(newClient.dealValue) || 5000,
    });

    setShowAddClientModal(false);
    setNewClient({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      address: '',
      latitude: 37.7749,
      longitude: -122.4194,
      stage: 'lead',
      nextFollowUpDate: todayStr,
      notes: '',
      assignedStaffId: currentStaff.id,
      dealValue: 10000,
    });
  };

  const handleLogFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForLog) return;
    if (!followUpSummary.trim()) {
      addToast('Please write a brief summary note of your client interaction.', 'warning');
      return;
    }

    logFollowUp(selectedClientForLog.id, {
      date: new Date().toISOString(),
      channel: followUpChannel,
      summary: followUpSummary,
      nextActionDate: nextActionDate,
      loggedBy: currentStaff.name,
    });

    setSelectedClientForLog(null);
    setFollowUpSummary('');
  };

  // Filtered client list
  const filteredClients = clientsList.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (stageFilter === 'all') return true;
    if (stageFilter === 'overdue') return c.nextFollowUpDate && c.nextFollowUpDate < todayStr;
    if (stageFilter === 'due_today') return c.nextFollowUpDate && c.nextFollowUpDate === todayStr;
    return c.stage === stageFilter;
  });

  return (
    <BiometricGuard
      scope="clients"
      title="Client Directory & CRM"
      description="Access to confidential client phone numbers, WhatsApp lines, email histories, and deal valuations requires WebAuthn biometric verification."
    >
      <div className="space-y-4">
        {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Client Directory & Follow-Up Hub
          </h2>
          <p className="text-xs text-slate-500">
            WhatsApp 1-tap messaging, email dispatch, and reminder tracking
          </p>
        </div>

        <button
          onClick={() => setShowAddClientModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Client</span>
        </button>
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueClients.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block">
                {overdueClients.length} Follow-Up Reminders Require Attention
              </span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {overdueClients.map((c) => c.companyName).join(', ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStageFilter('overdue')}
            className="text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-md shrink-0 transition-colors"
          >
            Review Overdue
          </button>
        </div>
      )}

      {/* Search & Stage Filters */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search by company, contact person, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-blue-600 shadow-xs"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Clients' },
            { id: 'due_today', label: `Due Today (${dueTodayClients.length})` },
            { id: 'overdue', label: `Overdue (${overdueClients.length})` },
            { id: 'lead', label: 'Leads' },
            { id: 'proposal_sent', label: 'Proposals' },
            { id: 'active_client', label: 'Active' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[32px] ${
                stageFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-500 space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">No clients found</p>
          <p>No client profiles match your current search and filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => {
            const isOverdue = client.nextFollowUpDate && client.nextFollowUpDate < todayStr;
            const isDueToday = client.nextFollowUpDate && client.nextFollowUpDate === todayStr;

            // Direct mail link
            const mailUrl = generateMailtoUrl(client.email, 'quote_followup', {
              clientName: client.companyName,
              contactPerson: client.contactPerson,
              companyName: client.companyName,
              staffName: currentStaff.name,
            });

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Header: Company & Stage */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900">{client.companyName}</h3>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="font-medium text-slate-800">{client.contactPerson}</span>
                      <span>·</span>
                      <span className="text-slate-500">{client.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                        client.stage === 'active_client'
                          ? 'bg-emerald-100 text-emerald-800'
                          : client.stage === 'proposal_sent'
                          ? 'bg-purple-100 text-purple-800'
                          : client.stage === 'negotiation'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {client.stage.replace('_', ' ')}
                    </span>

                    {client.dealValue && (
                      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                        ${client.dealValue.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Address & Assigned */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Account Lead:</span>
                    <strong className="text-slate-700">{client.assignedStaffName}</strong>
                  </div>
                </div>

                {/* Follow-up reminder date status */}
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between ${
                    isOverdue
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : isDueToday
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>
                      Next Follow-Up: <strong>{client.nextFollowUpDate || 'None Scheduled'}</strong>
                    </span>
                  </div>

                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {isOverdue ? 'Overdue Action' : isDueToday ? 'Due Today' : 'Scheduled'}
                  </span>
                </div>

                {/* Recent Follow-Up History snippet */}
                {client.followUpHistory.length > 0 && (
                  <div className="bg-slate-50/80 rounded-xl p-2.5 text-xs text-slate-600 space-y-1 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="uppercase font-semibold tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Last Touch ({client.followUpHistory[0].channel.toUpperCase()})
                      </span>
                      <span>
                        {new Date(client.followUpHistory[0].date).toLocaleDateString()} by{' '}
                        {client.followUpHistory[0].loggedBy}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed line-clamp-2">
                      {client.followUpHistory[0].summary}
                    </p>
                  </div>
                )}

                {/* 1-Tap Communication Actions & Log button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  {/* Left: Communication Triggers */}
                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp button */}
                    <button
                      onClick={() => {
                        setActiveTemplateModalClient(client);
                        setSelectedTemplate('quote_followup');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all min-h-[36px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Email Mailto button */}
                    <a
                      href={mailUrl}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors min-h-[36px]"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>

                    {/* Direct Call */}
                    <a
                      href={`tel:${client.phone}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors min-h-[36px]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  </div>

                  {/* Right: Log Follow-Up Button */}
                  <button
                    onClick={() => {
                      setSelectedClientForLog(client);
                      setFollowUpSummary('');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors min-h-[36px]"
                  >
                    <span>Log Follow-Up</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Template Selector Modal */}
      {activeTemplateModalClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Send WhatsApp: {activeTemplateModalClient.companyName}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {activeTemplateModalClient.whatsappNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTemplateModalClient(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">Choose Message Template:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'quote_followup', label: 'Quotation Follow-Up' },
                  { id: 'visit_scheduled', label: 'Service Visit Notice' },
                  { id: 'arrived_on_site', label: 'Arrived On Site' },
                  { id: 'urgent_reminder', label: 'Urgent Action Reminder' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id as TemplateType)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      selectedTemplate === tpl.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Preview */}
            <div className="bg-slate-900 text-emerald-100 p-3 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto border border-slate-800">
              {getWhatsAppTemplateText(selectedTemplate, {
                clientName: activeTemplateModalClient.companyName,
                contactPerson: activeTemplateModalClient.contactPerson,
                companyName: activeTemplateModalClient.companyName,
                staffName: currentStaff.name,
                dutyTitle: 'Scheduled Operations Visit',
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTemplateModalClient(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>

              <a
                href={generateWhatsAppUrl(activeTemplateModalClient.whatsappNumber, selectedTemplate, {
                  clientName: activeTemplateModalClient.companyName,
                  contactPerson: activeTemplateModalClient.contactPerson,
                  companyName: activeTemplateModalClient.companyName,
                  staffName: currentStaff.name,
                  dutyTitle: 'Scheduled Operations Visit',
                })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // Auto-log quick activity
                  logFollowUp(activeTemplateModalClient.id, {
                    date: new Date().toISOString(),
                    channel: 'whatsapp',
                    summary: `Sent WhatsApp message using "${selectedTemplate.replace('_', ' ')}" template.`,
                    nextActionDate: activeTemplateModalClient.nextFollowUpDate,
                    loggedBy: currentStaff.name,
                  });
                  setActiveTemplateModalClient(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <span>Launch WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Log Follow-Up Drawer */}
      {selectedClientForLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Log Follow-Up: {selectedClientForLog.companyName}
              </h3>
              <button
                onClick={() => setSelectedClientForLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogFollowUpSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Channel Used:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['whatsapp', 'email', 'call', 'visit'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setFollowUpChannel(ch)}
                      className={`py-2 px-2 rounded-xl text-center capitalize font-semibold border transition-all ${
                        followUpChannel === ch
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Discussion Outcome & Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Spoke with Dr. Evelyn. She accepted the updated proposal and requested contract signing on Monday."
                  value={followUpSummary}
                  onChange={(e) => setFollowUpSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Schedule Next Follow-Up Reminder:
                </label>
                <input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedClientForLog(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Register New Client Profile
              </h3>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClientSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Industrial Corp"
                    value={newClient.companyName}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, companyName: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Person:</label>
                  <input
                    type="text"
                    placeholder="e.g. Rachel Adams"
                    value={newClient.contactPerson}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address:</label>
                  <input
                    type="email"
                    placeholder="rachel@apexindustrial.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number:</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 789-0123"
                    value={newClient.phone}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">WhatsApp Number:</label>
                  <input
                    type="text"
                    placeholder="+15557890123"
                    value={newClient.whatsappNumber}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deal Potential ($):</label>
                  <input
                    type="number"
                    value={newClient.dealValue}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, dealValue: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Site Physical Address:</label>
                <input
                  type="text"
                  placeholder="e.g. 185 Berry St, Suite 400, San Francisco, CA"
                  value={newClient.address}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CRM Stage:</label>
                  <select
                    value={newClient.stage}
                    onChange={(e) =>
                      setNewClient((prev) => ({ ...prev, stage: e.target.value as ClientStage }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="lead">Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="active_client">Active Client</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">First Follow-Up Date:</label>
                  <input
                    type="date"
                    value={newClient.nextFollowUpDate}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, nextFollowUpDate: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assign Account Lead:</label>
                <select
                  value={newClient.assignedStaffId}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, assignedStaffId: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </BiometricGuard>
  );
};
