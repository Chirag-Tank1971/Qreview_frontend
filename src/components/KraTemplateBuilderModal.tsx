import React, { useState, useEffect } from 'react';
import { KraTemplate, KraItem, Kra, Department, Designation } from '../types';
import {
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Library,
  ArrowRight,
  Info,
  Scale,
  Sparkles,
} from 'lucide-react';

interface KraTemplateBuilderModalProps {
  template?: KraTemplate | null;
  departments: Department[];
  designations: Designation[];
  kraLibrary: Kra[];
  onSave: (templateData: Partial<KraTemplate>) => Promise<void>;
  onClose: () => void;
  onOpenLibrary: () => void;
}

export const KraTemplateBuilderModal: React.FC<KraTemplateBuilderModalProps> = ({
  template,
  departments,
  designations,
  kraLibrary,
  onSave,
  onClose,
  onOpenLibrary,
}) => {
  const [title, setTitle] = useState(template?.title || template?.name || '');
  const [departmentId, setDepartmentId] = useState(template?.departmentId || '');
  const [designationId, setDesignationId] = useState(template?.designationId || '');
  const [items, setItems] = useState<KraItem[]>(
    template?.items && template.items.length > 0
      ? template.items
      : [
          {
            id: `item_${Date.now()}_1`,
            title: 'Core Deliverables & Sprint Execution',
            description: 'Timely and defect-free execution of assigned quarterly projects',
            target: '≥ 90% planned deliverables completed within sprint SLA',
            measurementCriteria: '1: <70% | 3: 85-90% | 5: >95% + exceptional quality',
            weight: 40,
          },
          {
            id: `item_${Date.now()}_2`,
            title: 'Quality & Process Rigor',
            description: 'Maintain high technical and operational standards',
            target: 'Zero critical defect slippages and active peer review',
            measurementCriteria: '1: Defects reported | 3: Clean deliverables | 5: Process optimization',
            weight: 35,
          },
          {
            id: `item_${Date.now()}_3`,
            title: 'Team Collaboration & Mentorship',
            description: 'Cross-functional support and mentoring teammates',
            target: 'Active participation in reviews and knowledge sharing',
            measurementCriteria: '1: Low engagement | 3: Meets expectations | 5: Proactive leadership',
            weight: 25,
          },
        ]
  );

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  // Filter designations by selected department
  const filteredDesignations = designations.filter(
    (d) => !departmentId || d.departmentId === departmentId
  );

  useEffect(() => {
    if (departmentId && filteredDesignations.length > 0 && !filteredDesignations.some((d) => d.id === designationId)) {
      setDesignationId(filteredDesignations[0].id);
    }
  }, [departmentId, filteredDesignations, designationId]);

  // Compute total weight
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const isExact100 = Math.round(totalWeight) === 100;

  const handleAddItem = () => {
    const newItem: KraItem = {
      id: `item_${Date.now()}_${items.length + 1}`,
      title: '',
      description: '',
      target: '',
      measurementCriteria: '',
      weight: 10,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setError('A template must contain at least one KRA item.');
      return;
    }
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
    setError('');
  };

  const handleItemChange = (index: number, field: keyof KraItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleAddFromLibrary = (kra: Kra) => {
    const newItem: KraItem = {
      id: `item_${Date.now()}_${items.length + 1}`,
      kraId: kra.id,
      title: kra.title,
      description: kra.description,
      target: kra.targetUnit ? `Target: [Value] ${kra.targetUnit}` : 'Target milestone / goal',
      measurementCriteria: '1: Below target | 3: Target met | 5: Exceeds target',
      weight: 15,
    };
    setItems([...items, newItem]);
    setShowLibraryPicker(false);
  };

  const handleAutoRebalance = () => {
    if (items.length === 0) return;
    const baseWeight = Math.floor(100 / items.length);
    const remainder = 100 - baseWeight * items.length;

    const rebalanced = items.map((item, idx) => ({
      ...item,
      weight: idx === 0 ? baseWeight + remainder : baseWeight,
    }));
    setItems(rebalanced);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Template title is required');
      return;
    }
    if (!departmentId) {
      setError('Department is required');
      return;
    }
    if (!designationId) {
      setError('Designation is required');
      return;
    }
    if (!isExact100) {
      setError(`Total weightage must equal exactly 100%. Currently it is ${totalWeight}%`);
      return;
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].title.trim()) {
        setError(`Item #${i + 1} is missing a title.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');
      await onSave({
        ...(template ? { id: template.id } : {}),
        title: title.trim(),
        departmentId,
        designationId,
        items,
        totalWeight: 100,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save KRA template');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">
                  {template ? 'Edit KRA Evaluation Template' : 'Create KRA Evaluation Template'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  100% Invariant Rule
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the Key Result Areas, targets, and weighted scoring criteria for quarterly appraisals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Template Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer Core KRA"
                className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setDesignationId(''); // Reset designation when department changes
                }}
                className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Designation <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={designationId}
                onChange={(e) => setDesignationId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Select Designation</option>
                {filteredDesignations.map((des) => (
                  <option key={des.id} value={des.id}>
                    {des.name} (L{des.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => setShowLibraryPicker(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Library className="w-3.5 h-3.5" />
                Pick from Standard KRA Library
              </button>
            </div>
          </div>

          {/* Library Picker Modal Popup if clicked */}
          {showLibraryPicker && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                  <Library className="w-4 h-4 text-blue-600" />
                  <span>Select a standard KRA to insert into this template:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLibraryPicker(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {kraLibrary.map((kra) => (
                  <button
                    key={kra.id}
                    type="button"
                    onClick={() => handleAddFromLibrary(kra)}
                    className="text-left p-2 bg-white border border-blue-100 hover:border-blue-300 rounded-lg text-xs shadow-2xs hover:bg-blue-50/50 transition-all flex flex-col justify-between"
                  >
                    <span className="font-semibold text-slate-800 line-clamp-1">{kra.title}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {kra.category} • {kra.metricType}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weightage Tracker Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Total KRA Weightage:</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isExact100
                      ? 'bg-emerald-100 text-emerald-800'
                      : totalWeight > 100
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {totalWeight}% / 100%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoRebalance}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Rebalance to 100%
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  isExact100
                    ? 'bg-emerald-500'
                    : totalWeight > 100
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
            {!isExact100 && (
              <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>
                  {totalWeight < 100
                    ? `Allocate remaining ${100 - totalWeight}% across items before saving.`
                    : `Reduce ${totalWeight - 100}% to balance total to exactly 100%.`}
                </span>
              </p>
            )}
          </div>

          {/* KRA Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Evaluation Items ({items.length})
              </h4>
              <button
                type="button"
                id="btn-add-custom-kra-item"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                      {idx + 1}
                    </span>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          KRA Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={item.title}
                          onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                          placeholder="e.g. Sprint Feature Delivery & Execution"
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Weightage (%) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min="1"
                            max="100"
                            value={item.weight}
                            onChange={(e) => handleItemChange(idx, 'weight', Number(e.target.value))}
                            className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg pr-7 focus:bg-white focus:ring-1 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                            %
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Specific expectations and quality deliverables..."
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Target / Milestone
                        </label>
                        <input
                          type="text"
                          value={item.target}
                          onChange={(e) => handleItemChange(idx, 'target', e.target.value)}
                          placeholder="e.g. ≥ 90% sprint story points completed"
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          1 - 5 Scoring Rubric / Measurement Criteria
                        </label>
                        <input
                          type="text"
                          value={item.measurementCriteria || ''}
                          onChange={(e) => handleItemChange(idx, 'measurementCriteria', e.target.value)}
                          placeholder="e.g. 1: <70% | 3: 85-90% (Meets target) | 5: >95% (Exceeds)"
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-600"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                      title="Remove KRA item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600" />
            <span>
              Templates become immutable snapshots when quarterly reviews are initiated.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-kra-template"
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || !isExact100}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Saving Template...' : template ? 'Update Template' : 'Save & Publish Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
