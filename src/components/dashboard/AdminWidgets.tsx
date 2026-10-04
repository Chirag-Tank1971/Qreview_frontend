import React from 'react';
import {
  AlertTriangle, BarChart2, Calendar, CheckCircle2, ChevronRight,
  Database, FileText, Info, RefreshCw, Server, Settings, Target,
  TrendingDown, TrendingUp, Upload, UserCheck, UserMinus, UserPlus, Users, Zap,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { DashboardAdminOverview, DashboardTaskLink } from '../../types';
import { cn } from '../../utils/cn';

const CARD = 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm';
type OnNavigate = (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;

function pct(current: number, previous: number): { value: number; up: boolean } {
  if (!previous || previous === 0) return { value: 0, up: true };
  const diff = ((current - previous) / previous) * 100;
  return { value: Math.round(Math.abs(diff)), up: diff >= 0 };
}

const DEPT_COLORS = ['#6366f1','#8b5cf6','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];
const PROG_COLORS = ['#6366f1','#8b5cf6','#f59e0b','#10b981','#0ea5e9','#ef4444'];

const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: <span className="tabular-nums">{p.value}</span></p>
      ))}
    </div>
  );
};

export const AdminKpiStrip: React.FC<{ admin: DashboardAdminOverview; onNavigate: OnNavigate }> = ({ admin, onNavigate }) => {
  const empT = pct(admin.totalEmployees, admin.totalEmployeesLastMonth);
  const jnT  = pct(admin.newJoinersThisMonth, admin.newJoinersLastMonth);
  const exT  = pct(admin.exitsThisMonth, admin.exitsLastMonth);

  const kpis = [
    { label:'Total Employees', value:admin.totalEmployees, isText:false, sub:'vs last month', badge:{value:empT.value,up:empT.up}, iconEl:<Users className="w-5 h-5"/>, ibg:'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400', go:()=>onNavigate('employees') },
    { label:'New Joiners', value:admin.newJoinersThisMonth, isText:false, sub:'this month', badge:{value:jnT.value,up:jnT.up}, iconEl:<UserPlus className="w-5 h-5"/>, ibg:'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400', go:()=>onNavigate('employees') },
    { label:'Exits', value:admin.exitsThisMonth, isText:false, sub:'this month', badge:{value:exT.value,up:!exT.up}, iconEl:<UserMinus className="w-5 h-5"/>, ibg:'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400', go:()=>onNavigate('employees') },
    { label:'Active Review Cycle', value:admin.activePeriodName||admin.activeCycleName||'—', isText:true,
      sub: admin.activePeriodStart&&admin.activePeriodEnd ? `${new Date(admin.activePeriodStart).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${new Date(admin.activePeriodEnd).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}` : 'No active period',
      statusBadge:'On Track', badge:null, iconEl:<Calendar className="w-5 h-5"/>, ibg:'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400', go:()=>onNavigate('reviews') },
    { label:'Pending Approvals', value:admin.pendingApprovalsCount, isText:false, sub:null, badge:null, viewAll:true, iconEl:<CheckCircle2 className="w-5 h-5"/>, ibg:'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400', go:()=>onNavigate('appraisals') },
    { label:'System Alerts', value:admin.systemAlertsCount, isText:false, sub:null, badge:null, viewAll:true, iconEl:<AlertTriangle className="w-5 h-5"/>, ibg:'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400', go:()=>onNavigate('audit') },
  ] as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((k,i) => (
        <button key={i} type="button" onClick={k.go} className={cn(CARD,'p-4 text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer group w-full')}>
          <div className="flex items-center justify-between mb-3">
            <div className={cn('p-2 rounded-lg',k.ibg)}>{k.iconEl}</div>
            {k.badge && (
              <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full', k.badge.up ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400')}>
                {k.badge.up ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}{k.badge.value}%
              </span>
            )}
            {('statusBadge' in k) && k.statusBadge && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>{k.statusBadge}
              </span>
            )}
            {('viewAll' in k) && k.viewAll && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors"/>}
          </div>
          {k.isText
            ? <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{k.value}</p>
            : <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{k.value}</p>
          }
          <p className="text-[11px] text-slate-400 mt-0.5">{k.label}</p>
          {k.sub && <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>}
        </button>
      ))}
    </div>
  );
};

export const HeadcountOverviewCard: React.FC<{ admin: DashboardAdminOverview; className?: string }> = ({ admin, className }) => (
  <section className={cn(CARD,'p-4 flex flex-col gap-3 min-w-0',className)}>
    <div className="flex items-center justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Headcount Overview</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Total employees and new joiners over time</p>
      </div>
      <span className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-medium">Last 7 Months</span>
    </div>
    <ResponsiveContainer width="100%" height={190}>
      <ComposedChart data={admin.headcountTrend} margin={{ top:4, right:4, left:-20, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)"/>
        <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
        <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
        <Tooltip content={<ChartTooltip/>}/>
        <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:'#94a3b8',paddingTop:6}}/>
        <Bar dataKey="total" name="Total Employees" fill="#a5b4fc" radius={[4,4,0,0]} maxBarSize={28}/>
        <Line type="monotone" dataKey="newJoiners" name="New Joiners" stroke="#6366f1" strokeWidth={2} dot={{r:3,fill:'#6366f1',strokeWidth:0}} activeDot={{r:5}}/>
      </ComposedChart>
    </ResponsiveContainer>
  </section>
);

export const DepartmentDistributionCard: React.FC<{ admin: DashboardAdminOverview; className?: string }> = ({ admin, className }) => {
  const data = admin.departmentDistribution;
  return (
    <section className={cn(CARD,'p-4 flex flex-col gap-3 min-w-0',className)}>
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Department Distribution</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Employees across departments</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <PieChart width={130} height={130}>
            <Pie data={data.length>0?data:[{departmentName:'No data',count:1,percentage:100}]} cx={60} cy={60} innerRadius={38} outerRadius={60} dataKey="count" paddingAngle={2} stroke="none">
              {(data.length>0?data:[{}]).map((_:any,i:number) => <Cell key={i} fill={data.length>0?DEPT_COLORS[i%DEPT_COLORS.length]:'#e2e8f0'}/>)}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{admin.totalEmployees}</span>
            <span className="text-[9px] text-slate-400 leading-none">Employees</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0 max-h-[130px] overflow-y-auto">
          {data.map((d,i) => (
            <div key={d.departmentId} className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:DEPT_COLORS[i%DEPT_COLORS.length]}}/>
              <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{d.departmentName}</span>
              <span className="text-slate-400 tabular-nums shrink-0">{d.percentage}% ({d.count})</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const AdminUpcomingEventsCard: React.FC<{ admin: DashboardAdminOverview; onNavigate: OnNavigate; className?: string }> = ({ admin, onNavigate, className }) => {
  const now = new Date();
  const events: { month:string; day:string; title:string; sub:string; view:DashboardTaskLink['view'] }[] = [];
  if (admin.activePeriodEnd) {
    const end = new Date(admin.activePeriodEnd);
    events.push({ month:end.toLocaleDateString('en-US',{month:'short'}).toUpperCase(), day:String(end.getDate()), title:'Review cycle close', sub:admin.activePeriodName||'', view:'reviews' });
    const mgr = new Date(admin.activePeriodEnd); mgr.setDate(mgr.getDate()-7);
    if (mgr>now) events.push({ month:mgr.toLocaleDateString('en-US',{month:'short'}).toUpperCase(), day:String(mgr.getDate()), title:'Manager reviews due', sub:admin.activePeriodName||'', view:'reviews' });
  }
  if (admin.totalTemplates===0) events.push({ month:now.toLocaleDateString('en-US',{month:'short'}).toUpperCase(), day:'—', title:'Assign KRA templates', sub:'No KRA templates configured', view:'kras' });

  return (
    <section className={cn(CARD,'p-4 flex flex-col gap-3 min-w-0',className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Events</h2>
        <button type="button" onClick={()=>onNavigate('reviews')} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer">View all</button>
      </div>
      <div className="flex flex-col gap-1">
        {events.length===0
          ? <p className="text-[11px] text-slate-400 py-4 text-center">No upcoming events</p>
          : events.slice(0,4).map((evt,i) => (
            <button key={i} type="button" onClick={()=>onNavigate(evt.view)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors cursor-pointer group">
              <div className="flex flex-col items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 shrink-0">
                <span className="text-[8px] font-bold text-indigo-500 dark:text-indigo-400 uppercase leading-none">{evt.month}</span>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 leading-tight tabular-nums">{evt.day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{evt.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{evt.sub}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0"/>
            </button>
          ))
        }
      </div>
    </section>
  );
};

export const ReviewCycleProgressCard: React.FC<{ admin: DashboardAdminOverview; onNavigate: OnNavigate; className?: string }> = ({ admin, onNavigate, className }) => (
  <section className={cn(CARD,'p-4 flex flex-col gap-3 min-w-0',className)}>
    <div className="flex items-center justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Review Cycle Progress</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Per-department for {admin.activePeriodName||admin.activeCycleName||'current cycle'}</p>
      </div>
      <button type="button" onClick={()=>onNavigate('reviews')} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer shrink-0">View all</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <th className="pb-2 pr-3 font-semibold">Department</th>
            <th className="pb-2 pr-3 font-semibold text-right">Staff</th>
            <th className="pb-2 font-semibold">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {admin.reviewCycleProgress.length===0
            ? <tr><td colSpan={3} className="py-6 text-center text-slate-400 text-[11px]">No department data yet</td></tr>
            : admin.reviewCycleProgress.map((dept,i) => (
              <tr key={dept.departmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 pr-3"><span className="font-semibold text-slate-800 dark:text-slate-100 truncate block max-w-[110px]">{dept.departmentName}</span></td>
                <td className="py-2.5 pr-4 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">{dept.totalEmployees}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${dept.completionRate}%`,backgroundColor:PROG_COLORS[i%PROG_COLORS.length]}}/>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums shrink-0 w-8 text-right">{dept.completionRate}%</span>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  </section>
);

const ATN_ICONS = { warning:AlertTriangle, info:Info, calendar:Calendar, user:Users } as const;
const ATN_COLORS = {
  red:    { bg:'bg-rose-50 dark:bg-rose-950/40',   icon:'text-rose-600 dark:text-rose-400',   border:'border-rose-100 dark:border-rose-900/30' },
  blue:   { bg:'bg-sky-50 dark:bg-sky-950/40',     icon:'text-sky-600 dark:text-sky-400',     border:'border-sky-100 dark:border-sky-900/30' },
  purple: { bg:'bg-purple-50 dark:bg-purple-950/40',icon:'text-purple-600 dark:text-purple-400',border:'border-purple-100 dark:border-purple-900/30' },
  amber:  { bg:'bg-amber-50 dark:bg-amber-950/40', icon:'text-amber-600 dark:text-amber-400', border:'border-amber-100 dark:border-amber-900/30' },
} as const;

export const AdminAttentionCard: React.FC<{ admin: DashboardAdminOverview; onNavigate: OnNavigate; className?: string }> = ({ admin, onNavigate, className }) => (
  <section className={cn(CARD,'p-4 flex flex-col gap-3 min-w-0',className)}>
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Needs Your Attention</h2>
      <button type="button" onClick={()=>onNavigate('audit')} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer">View all</button>
    </div>
    <div className="flex flex-col gap-2">
      {admin.attentionItems.length===0
        ? <div className="flex flex-col items-center py-5 gap-2 text-center"><CheckCircle2 className="w-7 h-7 text-emerald-500"/><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">All caught up!</p><p className="text-[11px] text-slate-400">No pending admin actions</p></div>
        : admin.attentionItems.map(item => {
          const Icon = ATN_ICONS[item.icon]; const c = ATN_COLORS[item.color];
          return (
            <button key={item.id} type="button" onClick={()=>onNavigate(item.link.view,item.link.params)} className={cn('flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer group hover:brightness-95 dark:hover:brightness-110',c.bg,c.border)}>
              <div className={cn('p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/40 shrink-0',c.icon)}><Icon className="w-4 h-4"/></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.detail}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0"/>
            </button>
          );
        })
      }
    </div>
  </section>
);

export const AdminQuickActions: React.FC<{ onNavigate: OnNavigate; className?: string }> = ({ onNavigate, className }) => {
  const acts = [
    { title:'Create Review Cycle', icon:RefreshCw, color:'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400', view:'appraisals' as const },
    { title:'Manage Users & Roles', icon:UserCheck, color:'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400', view:'employees' as const },
    { title:'Assign KRAs', icon:Target, color:'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400', view:'kras' as const },
    { title:'View Reports', icon:BarChart2, color:'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400', view:'reports' as const },
    { title:'Bulk Import Data', icon:Upload, color:'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400', view:'bulk' as const },
    { title:'System Settings', icon:Settings, color:'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', view:'audit' as const },
  ];
  return (
    <section className={cn(CARD,'p-4 flex flex-col gap-3 min-w-0',className)}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {acts.map(act => { const I = act.icon; return (
          <button key={act.title} type="button" onClick={()=>onNavigate(act.view)} className="flex flex-col items-start gap-2 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer">
            <div className={cn('p-2 rounded-lg',act.color)}><I className="w-4 h-4"/></div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight">{act.title}</span>
          </button>
        );})}
      </div>
    </section>
  );
};

export const AdminRecentActivity: React.FC<{ admin: DashboardAdminOverview; onNavigate: OnNavigate; className?: string }> = ({ admin, onNavigate, className }) => (
  <section className={cn(CARD,'p-4 flex flex-col gap-3 min-w-0',className)}>
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
      <button type="button" onClick={()=>onNavigate('audit')} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer">View all</button>
    </div>
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
      {admin.recentSecurityEvents.length===0
        ? <p className="text-[11px] text-slate-400 py-4 text-center">No recent activity</p>
        : admin.recentSecurityEvents.slice(0,5).map(evt => (
          <div key={evt.id} className="py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 uppercase">{evt.initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">{evt.actorName}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{evt.action}</p>
            </div>
            <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{evt.relativeTime}</span>
          </div>
        ))
      }
    </div>
  </section>
);

export const AdminTopActionsRow: React.FC<{ admin: DashboardAdminOverview; onNavigate: OnNavigate; className?: string }> = ({ admin, onNavigate, className }) => {
  const pills = [
    { label:'Pending Appraisals', value:admin.pendingApprovalsCount, color:'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300', view:'appraisals' as const },
    { label:'System Alerts',      value:admin.systemAlertsCount,     color:'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',           view:'audit' as const },
    { label:'KRA Templates',      value:admin.totalTemplates,         color:'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300', view:'kras' as const },
    { label:'Active Users',       value:admin.activeUsers,            color:'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',   view:'employees' as const },
  ];
  return (
    <section className={cn(CARD,'p-4 min-w-0',className)}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Top Actions This Week</h2>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {pills.map(p => (
          <button key={p.label} type="button" onClick={()=>onNavigate(p.view)} className={cn('flex flex-col items-center gap-1 p-3 rounded-xl cursor-pointer hover:opacity-90 transition-opacity',p.color)}>
            <span className="text-2xl font-bold tabular-nums">{p.value}</span>
            <span className="text-[10px] font-semibold text-center leading-tight">{p.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export const AdminSystemHealth: React.FC<{ admin: DashboardAdminOverview; className?: string }> = ({ admin, className }) => {
  const svcs = [
    { name:'Application Status', icon:Zap,     healthy:admin.systemStatus==='HEALTHY' },
    { name:'Database',           icon:Database, healthy:true },
    { name:'File Storage',       icon:Server,   healthy:true },
    { name:'Email Service',      icon:FileText, healthy:true },
  ];
  const now = new Date();
  const sync = now.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})+', '+now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  return (
    <section className={cn(CARD,'p-4 flex flex-col gap-3 min-w-0',className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">System Health</h2>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>Live
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {svcs.map(svc => { const I=svc.icon; return (
          <div key={svc.name} className="flex items-center gap-2.5 text-xs">
            <I className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
            <span className="text-slate-600 dark:text-slate-300 flex-1">{svc.name}</span>
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold',svc.healthy?'text-emerald-600 dark:text-emerald-400':'text-rose-600 dark:text-rose-400')}>
              <span className={cn('w-1.5 h-1.5 rounded-full',svc.healthy?'bg-emerald-500':'bg-rose-500')}/>{svc.healthy?'Healthy':'Degraded'}
            </span>
          </div>
        );})}
        <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]"><span className="text-slate-400">Last Data Sync</span><span className="text-slate-600 dark:text-slate-300 font-medium">{sync}</span></div>
          <div className="flex items-center justify-between text-[11px]"><span className="text-slate-400">Uptime</span><span className="text-emerald-600 dark:text-emerald-400 font-semibold">99.9%</span></div>
          <div className="flex items-center justify-between text-[11px]"><span className="text-slate-400">Audit Records</span><span className="text-slate-600 dark:text-slate-300 font-medium tabular-nums">{admin.totalAuditLogs}</span></div>
        </div>
      </div>
    </section>
  );
};

// Legacy aliases for DashboardView.tsx compatibility
export const AdminAlertsPanel: React.FC<{ admin: DashboardAdminOverview; onNavigate: OnNavigate; className?: string }> = p => <AdminAttentionCard {...p}/>;
export const AdminMasterBreakdownTable: React.FC<{ admin: DashboardAdminOverview; onNavigate: OnNavigate; className?: string }> = p => <ReviewCycleProgressCard {...p}/>;
export const AdminSecurityFeedCard: React.FC<{ admin: DashboardAdminOverview; onNavigate: OnNavigate; className?: string }> = p => <AdminRecentActivity {...p}/>;
export const AdminSystemDiagnosticsCard: React.FC<{ admin: DashboardAdminOverview; className?: string }> = p => <AdminSystemHealth {...p}/>;
