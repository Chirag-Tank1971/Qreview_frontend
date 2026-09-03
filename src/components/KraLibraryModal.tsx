import React, { useState } from 'react';
import { Kra, Department } from '../types';
import { Target, Plus, Search, Filter, CheckCircle2, ShieldCheck, HelpCircle, Edit2, Layers, Tag } from 'lucide-react';

interface KraLibraryModalProps {
  kras: Kra[];
  departments: Department[];
  canEdit: boolean;
  onSaveKra: (kraData: Partial<Kra>) => Promise<void>;
  onClose: () => void;
}

export const KraLibraryModal: React.FC<KraLibraryModalProps> = ({
  kras,
  departments,
  canEdit,
  onSaveKra,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingKra, setEditingKra] = useState<Kra | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Delivery & Execution');
  const [formMetricType, setFormMetricType] = useState<Kra['metricType']>('PERCENTAGE');
  const [formTargetUnit, setFormTargetUnit] = useState('%');
  const [formDeptId, setFormDeptId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const categories = Array.from(new Set(kras.map((k) => k.category).filter(Boolean)));

  const filteredKras = kras.filter((k) => {
    if (selectedDept !== 'ALL' && k.departmentId !== selectedDept) return false;
    if (selectedCategory !== 'ALL' && k.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        k.title.toLowerCase().includes(q) ||
        k.description.toLowerCase().includes(q) ||
        k.category.toLowerCase().includes(q) ||
        (k.departmentName && k.departmentName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStartCreate = () => {
    setEditingKra(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Delivery & Execution');
    setFormMetricType('PERCENTAGE');
    setFormTargetUnit('%');
    setFormDeptId('');
    setFormError('');
    setIsCreating(true);
  };

  const handleStartEdit = (kra: Kra) => {
    setEditingKra(kra);
    setFormTitle(kra.title);
    setFormDesc(kra.description);
    setFormCategory(kra.category);
    setFormMetricType(kra.metricType);
    setFormTargetUnit(kra.targetUnit || '');
    setFormDeptId(kra.departmentId || '');
    setFormError('');
    setIsCreating(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Title is required');
      return;
    }
    try {
      setSubmitting(true);
      setFormError('');
      await onSaveKra({
        ...(editingKra ? { id: editingKra.id } : {}),
        title: formTitle.trim(),
        description: formDesc.trim(),
        category: formCategory.trim(),
        metricType: formMetricType,
        targetUnit: formTargetUnit.trim() || undefined,
        departmentId: formDeptId || undefined,
      });
      setIsCreating(false);
      setEditingKra(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save KRA item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">Master KRA Library</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {kras.length} items cataloged
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Standardized organizational Key Result Areas used to construct evaluation templates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && !isCreating && (
              <button
                id="btn-add-kra-library"
                onClick={handleStartCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Standard KRA
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isCreating ? (
            /* Creation / Edit Form */
            <form onSubmit={handleSubmitForm} className="space-y-4 max-w-2xl mx-auto bg-slate-50/70 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="text-sm font-semibold text-slate-800">
                  {editingKra ? `Edit KRA: ${editingKra.title}` : 'Add Standard KRA to Library'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KRA Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Sprint Feature Delivery & Execution"
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description & Objectives
                  </label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Describe the scope, objectives, and expected impact of this KRA..."
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Evaluation Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    list="category-suggestions"
                    placeholder="e.g. Delivery & Execution"
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <datalist id="category-suggestions">
                    <option value="Delivery & Execution" />
                    <option value="Quality & Reliability" />
                    <option value="Leadership & Team" />
                    <option value="Revenue & Growth" />
                    <option value="People & Operations" />
                    <option value="Customer Success" />
                    <option value="Innovation & Architecture" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Metric Measurement Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formMetricType}
                    onChange={(e) => setFormMetricType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PERCENTAGE">Percentage (% Completed / Attained)</option>
                    <option value="TARGET_NUMERIC">Quantitative Metric (Number / Value / SLA)</option>
                    <option value="RATING_SCALE">Qualitative Scale (1 - 5 Scoring Rubric)</option>
                    <option value="MILESTONE">Milestone / Deliverable SLA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Measurement Unit
                  </label>
                  <input
                    type="text"
                    value={formTargetUnit}
                    onChange={(e) => setFormTargetUnit(e.target.value)}
                    placeholder="e.g. %, ms, PRs/quarter, $ ARR"
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Associated Department (Optional)
                  </label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Departments (Universal KRA)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingKra ? 'Update KRA' : 'Save KRA'}
                </button>
              </div>
            </form>
          ) : (
            /* Catalog List & Search Filters */
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search KRAs by title, category, keywords..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:bg-white"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:bg-white"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* KRA Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredKras.length === 0 ? (
                  <div className="col-span-2 text-center py-10 text-slate-400 text-xs">
                    No KRAs found matching your search and filter criteria.
                  </div>
                ) : (
                  filteredKras.map((kra) => (
                    <div
                      key={kra.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                            {kra.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                            {kra.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                          {kra.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {kra.metricType}
                          </span>
                          {kra.targetUnit && (
                            <span className="text-slate-400">Unit: {kra.targetUnit}</span>
                          )}
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => handleStartEdit(kra)}
                            className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 p-1 rounded transition-opacity"
                            title="Edit KRA"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Standard KRAs enforce organizational measurement alignment</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
