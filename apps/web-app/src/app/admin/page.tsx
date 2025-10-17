"use client";

import {
  CheckCircle,
  Clock,
  Download,
  Filter,
  MoreVertical,
  Search,
  Shield,
  UserCheck,
  Users,
  UserX,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dummy friend requests data
  const [friendRequests, setFriendRequests] = useState([
    {
      id: 1,
      requester: {
        armyId: "A123",
        name: "Captain Sharma",
        designation: "Captain",
        unit: "4th Battalion",
      },
      requestee: {
        armyId: "B456",
        name: "Major Singh",
        designation: "Major",
        unit: "7th Battalion",
      },
      timestamp: "2024-10-15T10:30:00",
      status: "pending",
      reason: "Operational coordination required",
    },
    {
      id: 2,
      requester: {
        armyId: "C789",
        name: "Lt. Kumar",
        designation: "Lieutenant",
        unit: "2nd Battalion",
      },
      requestee: {
        armyId: "D012",
        name: "Col. Patel",
        designation: "Colonel",
        unit: "5th Battalion",
      },
      timestamp: "2024-10-15T09:15:00",
      status: "pending",
      reason: "Training coordination",
    },
    {
      id: 3,
      requester: {
        armyId: "E345",
        name: "Capt. Verma",
        designation: "Captain",
        unit: "3rd Battalion",
      },
      requestee: {
        armyId: "F678",
        name: "Maj. Reddy",
        designation: "Major",
        unit: "6th Battalion",
      },
      timestamp: "2024-10-15T08:45:00",
      status: "approved",
      reason: "Joint exercise planning",
    },
    {
      id: 4,
      requester: {
        armyId: "G901",
        name: "Lt. Gupta",
        designation: "Lieutenant",
        unit: "1st Battalion",
      },
      requestee: {
        armyId: "H234",
        name: "Brig. Rao",
        designation: "Brigadier",
        unit: "HQ Unit",
      },
      timestamp: "2024-10-14T16:20:00",
      status: "rejected",
      reason: "Security clearance check",
    },
    {
      id: 5,
      requester: {
        armyId: "I567",
        name: "Maj. Mehta",
        designation: "Major",
        unit: "8th Battalion",
      },
      requestee: {
        armyId: "J890",
        name: "Lt.Col. Joshi",
        designation: "Lt. Colonel",
        unit: "9th Battalion",
      },
      timestamp: "2024-10-15T11:00:00",
      status: "pending",
      reason: "Intelligence sharing",
    },
    {
      id: 6,
      requester: {
        armyId: "K123",
        name: "Capt. Nair",
        designation: "Captain",
        unit: "10th Battalion",
      },
      requestee: {
        armyId: "L456",
        name: "Maj. Desai",
        designation: "Major",
        unit: "11th Battalion",
      },
      timestamp: "2024-10-15T10:45:00",
      status: "pending",
      reason: "Logistics coordination",
    },
  ]);

  const handleApprove = (id) => {
    setFriendRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "approved" } : req)),
    );
  };

  const handleReject = (id) => {
    setFriendRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "rejected" } : req)),
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRequests = friendRequests.filter((req) => {
    const matchesSearch =
      searchQuery === "" ||
      req.requester.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester.armyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestee.armyId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === "all" || req.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: friendRequests.length,
    pending: friendRequests.filter((r) => r.status === "pending").length,
    approved: friendRequests.filter((r) => r.status === "approved").length,
    rejected: friendRequests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500">
                  Friend Request Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                  A
                </div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Requests
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.approved}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or Army ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requestee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-indigo-600">
                            {request.requester.name.split(" ")[0][0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.requester.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.requester.armyId} •{" "}
                            {request.requester.designation}
                          </div>
                          <div className="text-xs text-gray-400">
                            {request.requester.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-green-600">
                            {request.requestee.name.split(" ")[0][0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.requestee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.requestee.armyId} •{" "}
                            {request.requestee.designation}
                          </div>
                          <div className="text-xs text-gray-400">
                            {request.requestee.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {request.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(request.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <UserCheck className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No friend requests found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">{filteredRequests.length}</span> of{" "}
              <span className="font-medium">{friendRequests.length}</span>{" "}
              requests
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
