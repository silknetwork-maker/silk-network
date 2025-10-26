import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Lock } from "lucide-react";
import DashboardTab from "../components/admin/DashboardTab";
import UsersTab from "../components/admin/UsersTab";
import NotificationsTab from "../components/admin/NotificationsTab";
import TasksTab from "../components/admin/TasksTab";
import SettingsTab from "../components/admin/SettingsTab";
import TransactionsTab from "../components/admin/TransactionsTab";
import SendTokensTab from "../components/admin/SendTokensTab";

export default function Admin() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 p-6">
        <div className="text-center">
          <Lock className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400">Manage Silk Network</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-indigo-500/30 p-1 h-auto flex-wrap justify-start">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-indigo-600">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-indigo-600">
              Users
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-indigo-600">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-indigo-600">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-indigo-600">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="sendtokens" className="data-[state=active]:bg-indigo-600">
              Send Tokens
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-indigo-600">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksTab />
          </TabsContent>

          <TabsContent value="sendtokens">
            <SendTokensTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
