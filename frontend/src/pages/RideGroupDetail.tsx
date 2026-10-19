import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RideGroup, GroupMember } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AlertBanner } from '../components/AlertBanner';
import { Modal } from '../components/Modal';
import { StarRating } from '../components/StarRating';
import { 
  Clock, MapPin, Users, IndianRupee, CheckCircle2, XCircle, 
  AlertTriangle, Star, ShieldAlert, CreditCard, ArrowLeft, RefreshCw, Flag
} from 'lucide-react';

interface RideGroupDetailProps {
  groupId: number;
  onBack: () => void;
}

export const RideGroupDetail: React.FC<RideGroupDetailProps> = ({ groupId, onBack }) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<RideGroup | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [showFareModal, setShowFareModal] = useState<boolean>(false);
  const [actualFareInput, setActualFareInput] = useState<string>('240');

  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Schedule changed due to lab timing');

  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [ratingTargetMember, setRatingTargetMember] = useState<GroupMember | null>(null);
  const [starCount, setStarCount] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('Punctual and friendly companion.');

  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('Unreasonable delay or no-show');
  const [reportDesc, setReportDesc] = useState<string>('');

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const data = await api.getGroupDetails(groupId);
      setGroup(data);
      if (data.actual_fare) {
        setActualFareInput(data.actual_fare.toString());
      } else if (data.estimated_fare) {
        setActualFareInput(data.estimated_fare.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 glass-panel rounded-2xl">
        Loading ride group details...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-12 text-center glass-panel rounded-2xl">
        <AlertTriangle size={36} className="mx-auto text-amber-500 mb-2" />
        <h4 className="text-white font-semibold">Group Not Found</h4>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const myMembership = group.members?.find(m => m.user_id === user?.user_id && ['PENDING', 'CONFIRMED'].includes(m.membership_status));
  const isCoordinator = group.coordinator_id === user?.user_id;
  const isDeadlineSet = !!group.confirmation_deadline;

  // Confirmation Handlers
  const handleSetDeadline = async () => {
    try {
      await api.setDeadline(groupId);
      setActionSuccess('Confirmation window initiated (10-minute deadline set).');
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirm = async () => {
    if (!myMembership) return;
    try {
      const res = await api.confirmParticipation(myMembership.membership_id, groupId);
      setActionSuccess(res.message);
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDecline = async () => {
    if (!myMembership) return;
    try {
      await api.declineParticipation(myMembership.membership_id);
      setActionSuccess('Participation declined.');
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExpireGroup = async () => {
    try {
      await api.setDeadline(groupId); // Or direct expire if deadline elapsed
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fare Handlers
  const handleRecordFare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fare = parseFloat(actualFareInput);
      const res = await api.recordActualFare(groupId, fare);
      setShowFareModal(false);
      setActionSuccess(res.message);
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdatePayment = async (membershipId: number, status: string) => {
    try {
      await api.updatePayment(membershipId, status);
      setActionSuccess(`Payment status set to ${status}.`);
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Cancellation Handler
  const handleCancelParticipation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.cancelParticipation(groupId, cancelReason);
      setShowCancelModal(false);
      setActionSuccess(res.message);
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Mark Completed
  const handleCompleteRide = async () => {
    try {
      await api.completeRide(groupId);
      setActionSuccess('Ride successfully marked as COMPLETED! Peer ratings are now open.');
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Submit Rating
  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingTargetMember) return;
    try {
      await api.submitRating(groupId, ratingTargetMember.membership_id, starCount, reviewText);
      setShowRatingModal(false);
      setActionSuccess(`Rating submitted for ${ratingTargetMember.full_name}. Reviewer identity is protected.`);
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Submit Incident Report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitReport({
        group_id: groupId,
        report_reason: reportReason,
        description: reportDesc,
      });
      setShowReportModal(false);
      setActionSuccess('Report submitted to administrator review queue.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={15} />
        <span>Back to Groups</span>
      </button>

      {error && <AlertBanner type="error" message={error} />}
      {actionSuccess && <AlertBanner type="success" message={actionSuccess} />}

      {/* Main Group Header Card */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Group #{group.group_id}
              </span>
              <StatusBadge status={group.group_status} type="group" />
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {group.request_type === 'VEHICLE_ARRANGED' ? 'Vehicle Arranged' : 'Looking for Companions'}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-2xl font-extrabold text-white">
              <span>{group.pickup_location}</span>
              <span className="text-emerald-400">→</span>
              <span>{group.destination}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
              <span className="flex items-center space-x-1.5">
                <Clock size={14} className="text-emerald-400" />
                <span>Departure: {new Date(group.departure_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1.5">
                <Users size={14} className="text-teal-400" />
                <span>Coordinator: {group.coordinator_name}</span>
              </span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">Fare Split</div>
            <div className="text-2xl font-extrabold text-white">
              ₹{group.actual_fare || group.estimated_fare || 250}
            </div>
            <div className="text-xs text-emerald-400 font-medium">
              {group.actual_fare ? 'Agreed Actual Fare' : 'Predefined Route Estimate'}
            </div>
          </div>
        </div>

        {/* Confirmation Window Banner */}
        {group.group_status === 'PENDING' && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-amber-300 flex items-center space-x-1.5">
                <Clock size={15} />
                <span>Confirmation Window</span>
              </div>
              <p className="text-slate-300">
                {isDeadlineSet
                  ? `Confirmation deadline: ${new Date(group.confirmation_deadline!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Group is forming. The coordinator can initiate the 10-minute confirmation window.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {isCoordinator && !isDeadlineSet && (
                <button
                  onClick={handleSetDeadline}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
                >
                  Start 10-Min Window
                </button>
              )}

              {myMembership && myMembership.confirmation_status === 'PENDING' && (
                <>
                  <button
                    onClick={handleConfirm}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition flex items-center space-x-1"
                  >
                    <CheckCircle2 size={14} />
                    <span>Confirm Seat</span>
                  </button>
                  <button
                    onClick={handleDecline}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 transition"
                  >
                    Decline
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Coordinator Controls Toolbar */}
        {isCoordinator && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-300">
              Coordinator Management Panel:
            </span>
            <div className="flex items-center space-x-2">
              {['PENDING', 'CONFIRMED'].includes(group.group_status) && (
                <button
                  onClick={() => setShowFareModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center space-x-1"
                >
                  <IndianRupee size={13} />
                  <span>{group.actual_fare ? 'Update Actual Fare' : 'Record Driver Fare'}</span>
                </button>
              )}

              {group.group_status === 'CONFIRMED' && (
                <button
                  onClick={handleCompleteRide}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition flex items-center space-x-1"
                >
                  <CheckCircle2 size={14} />
                  <span>Mark Ride Completed</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Participants Roster Table */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Participants & Seat Allocation</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {group.active_member_count}/3 Maximum Seats
            </span>
          </h3>

          <div className="flex items-center space-x-2">
            {myMembership && ['PENDING', 'CONFIRMED'].includes(group.group_status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition"
              >
                Cancel Participation
              </button>
            )}
            <button
              onClick={() => setShowReportModal(true)}
              className="p-1 rounded-lg text-slate-500 hover:text-amber-400 transition"
              title="Report Incident"
            >
              <Flag size={15} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Participant</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Confirmation</th>
                <th className="pb-3">Fare Share</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {group.members?.map((member) => {
                const isMe = member.user_id === user?.user_id;

                return (
                  <tr key={member.membership_id} className="hover:bg-slate-900/40">
                    <td className="py-3">
                      <div className="font-semibold text-white">
                        {member.full_name} {isMe && <span className="text-emerald-400 text-[10px]">(You)</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">{member.email}</div>
                    </td>

                    <td className="py-3">
                      <StatusBadge status={member.member_role} type="role" />
                    </td>

                    <td className="py-3">
                      <StatusBadge status={member.confirmation_status || 'PENDING'} type="confirmation" />
                    </td>

                    <td className="py-3 font-semibold text-white">
                      ₹{member.share_amount || Math.round((group.actual_fare || group.estimated_fare || 250) / 3)}
                    </td>

                    <td className="py-3">
                      <StatusBadge status={member.payment_status || 'PENDING'} type="payment" />
                    </td>

                    <td className="py-3 text-right space-x-1.5">
                      {/* Simulated payment button for current user */}
                      {isMe && member.payment_status !== 'PAID' && group.group_status === 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdatePayment(member.membership_id, 'PAID')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition"
                        >
                          Mark Paid
                        </button>
                      )}

                      {/* Peer rating button */}
                      {!isMe && group.group_status === 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setRatingTargetMember(member);
                            setShowRatingModal(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition"
                        >
                          Rate Peer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Driver Actual Fare */}
      <Modal
        isOpen={showFareModal}
        onClose={() => setShowFareModal(false)}
        title="Record Agreed Vehicle Fare"
      >
        <form onSubmit={handleRecordFare} className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter the final fare agreed upon with the driver. Each participant’s share will be recalculated equally. The coordinator receives any 1-cent/integer rounding remainder.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Agreed Driver Fare (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-2.5 text-slate-500" size={17} />
              <input
                type="number"
                step="0.01"
                required
                min={1}
                value={actualFareInput}
                onChange={(e) => setActualFareInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Route estimate was ₹{group.estimated_fare || 250}. Differences over 25% are flagged for review.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition"
          >
            Calculate & Allocate Shares
          </button>
        </form>
      </Modal>

      {/* MODAL: Cancel Participation */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Ride Participation"
      >
        <form onSubmit={handleCancelParticipation} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs leading-relaxed">
            <span className="font-bold">60-Minute Cancellation Rule: </span>
            Cancellation is free up to 60 minutes before departure. Late withdrawals within 60 minutes are flagged for administrator audit.
            {isCoordinator && (
              <span className="block mt-1 text-teal-300 font-semibold">
                Note: Since you are coordinator, the earliest joined participant will automatically become the new coordinator.
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cancellation Reason
            </label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
          >
            Confirm Cancellation
          </button>
        </form>
      </Modal>

      {/* MODAL: Peer Rating */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title={`Rate ${ratingTargetMember?.full_name}`}
      >
        <form onSubmit={handleRateSubmit} className="space-y-4 text-center">
          <p className="text-xs text-slate-300">
            Submit a peer review for this completed ride. Your identity is anonymized and hidden from the reviewed member.
          </p>

          <div className="flex justify-center py-2">
            <StarRating
              rating={starCount}
              interactive={true}
              onChange={(r) => setStarCount(r)}
              size={28}
            />
          </div>

          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Review Comment (Optional)
            </label>
            <input
              type="text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            Submit Anonymous Rating
          </button>
        </form>
      </Modal>

      {/* MODAL: Report Incident */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Issue or Dispute"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <p className="text-xs text-slate-300">
            Reports are immediately queued for administrator review and require a mandatory recorded outcome note.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="Unreasonable delay or no-show">Unreasonable delay or no-show</option>
              <option value="Fare calculation or payment dispute">Fare calculation or payment dispute</option>
              <option value="Inappropriate behavior">Inappropriate behavior</option>
              <option value="Vehicle mismatch or safety concern">Vehicle mismatch or safety concern</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder="Provide context for campus administration review..."
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
          >
            Submit Incident Report
          </button>
        </form>
      </Modal>

    </div>
  );
};
