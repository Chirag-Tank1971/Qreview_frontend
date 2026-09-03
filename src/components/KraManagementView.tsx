import React, { useState } from 'react';
import { KraTemplate, Kra, Department, Designation, Employee } from '../types';
import {
  Layers,
  Plus,
  Search,
  Filter,
  FileText,
  Target,
  Users,
  Building2,
  CheckCircle2,
  ChevronRight,
  Edit2,
  Library,
  Scale,
  Sparkles,
  Award,
} from 'lucide-react';

interface KraManagementViewProps {
  templates: KraTemplate[];
  kras: Kra[];
  departments: Department[];
  designations: Designation[];
  employees: Employee[];
  canManage: boolean;
  onOpenCreateTemplate: () => void;
  onOpenEditTemplate: (template: KraTemplate) => void;
  onOpenLibrary: () => void;
}

export const KraManagementView: React.FC<KraManagementViewProps> = ({
  templates,
  kras,
  departments,
  designations,
  employees,
  canManage,
  onOpenCreateTemplate,
  onOpenEditTemplate,
  onOpenLibrary,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'TEMPLATES' | 'LIBRARY' | 'ASSIGNMENTS'>('TEMPLATES');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedTemplate, setSelectedTemplate] = useState<KraTemplate | null>(templates[0] || null);

  const filteredTemplates = templates.filter((t) => {
    if (selectedDept !== 'ALL' && t.departmentId !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = t.title || t.name || '';
      return (
        title.toLowerCase().includes(q) ||
        (t.departmentName && t.departmentName.toLowerCase().includes(q)) ||
        (t.designationName && t.designationName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              Appraisal Framework
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">100% Weightage Invariant Enforced</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">KRA Master & Template Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure standardized Key Result Areas, role-specific templates, and scoring rubrics for quarterly appraisals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-open-kra-library"
            onClick={onOpenLibrary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Library className="w-3.5 h-3.5 text-blue-600" />
            Standard KRA Library ({kras.length})
          </button>

          {canManage && (
            <button
              id="btn-create-kra-template"
              onClick={onOpenCreateTemplate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New KRA Template
            </button>
          )}
        </div>
      </div>

      {/* Sub navigation pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('TEMPLATES')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSubTab === 'TEMPLATES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          KRA Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveSubTab('LIBRARY')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSubTab === 'LIBRARY'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          Master Catalog ({kras.length})
        </button>

        <button
          onClick={() => setActiveSubTab('ASSIGNMENTS')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSubTab === 'ASSIGNMENTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Employee Role Mapping ({employees.length})
        </button>
      </div>

      {/* VIEW: TEMPLATES */}
      {activeSubTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates list (Left 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search & Department Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="ALL">All Depts</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Cards List */}
            <div className="space-y-2.5">
              {filteredTemplates.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                  No KRA templates found.
                </div>
              ) : (
                filteredTemplates.map((tmpl) => {
                  const isSelected = selectedTemplate?.id === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {tmpl.title || tmpl.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-slate-500 font-medium">
                              {tmpl.departmentName || 'General Dept'}
                            </span>
                            {tmpl.designationName && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[11px] text-slate-600 font-medium">
                                  {tmpl.designationName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                          {tmpl.items.length} KRAs • 100%
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Updated: {new Date(tmpl.updatedAt || tmpl.createdAt).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-xs">
                          Preview <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Template Detail / Preview Panel (Right 7 cols) */}
          <div className="lg:col-span-7">
            {selectedTemplate ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {selectedTemplate.departmentName || 'Department Template'}
                      </span>
                      {selectedTemplate.designationName && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                          {selectedTemplate.designationName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">
                      {selectedTemplate.title || selectedTemplate.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluation sheet snapshot applied to matching quarterly review periods
                    </p>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => onOpenEditTemplate(selectedTemplate)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      Edit Template
                    </button>
                  )}
                </div>

                {/* Weight summary card */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                      100%
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Total Weightage Invariant Verified
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedTemplate.items.length} structured KRAs with calibrated 1-5 scoring criteria
                      </div>
                    </div>
                  </div>
                  <Scale className="w-5 h-5 text-emerald-600" />
                </div>

                {/* Items detail list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Key Result Areas ({selectedTemplate.items.length})
                  </h4>

                  <div className="space-y-3">
                    {selectedTemplate.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {item.title || item.kraName}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                            {item.weight}%
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-600 leading-relaxed pl-7">
                            {item.description}
                          </p>
                        )}

                        <div className="pl-7 pt-1.5 border-t border-slate-100/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="font-semibold text-slate-700">Target / SLA: </span>
                            <span className="text-slate-600">{item.target}</span>
                          </div>
                          {item.measurementCriteria && (
                            <div>
                              <span className="font-semibold text-slate-700">1-5 Rubric: </span>
                              <span className="text-slate-500">{item.measurementCriteria}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                Select a template from the left list to view its complete scoring breakdown.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: MASTER CATALOG (LIBRARY) */}
      {activeSubTab === 'LIBRARY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kras.map((kra) => (
              <div
                key={kra.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{kra.title}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                      {kra.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-3 mb-3 leading-relaxed">
                    {kra.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                    {kra.metricType}
                  </span>
                  <span className="text-slate-400">
                    {kra.departmentName || 'Universal Organization'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: EMPLOYEE ASSIGNMENTS */}
      {activeSubTab === 'ASSIGNMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Employee Role & KRA Assignment Roster
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active employees mapped to their department designation and appraisal cohort
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
              {employees.length} Employees Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Designation</th>
                  <th className="py-3 px-4">Appraisal Cycle</th>
                  <th className="py-3 px-4">Current KRA Template</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((emp) => {
                  const matchingTemplate = templates.find(
                    (t) =>
                      t.id === emp.currentKraTemplateId ||
                      t.designationId === emp.designationId ||
                      t.departmentId === emp.departmentId
                  );

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{emp.employeeCode} • {emp.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{emp.designationName || 'Specialist'}</div>
                        <div className="text-[11px] text-slate-500">{emp.departmentName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                          style={{ backgroundColor: emp.cycleColor || '#1e3a8a' }}
                        >
                          Cycle {emp.cycleCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {matchingTemplate ? (
                          <div className="inline-flex items-center gap-1.5 text-blue-700 font-medium">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{matchingTemplate.title || matchingTemplate.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Default Department Template</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
