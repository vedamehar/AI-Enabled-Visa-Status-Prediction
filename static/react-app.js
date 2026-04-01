const { useEffect, useMemo, useState } = React;
const THEME_STORAGE_KEY = "visaThemePreference";

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const quarterOptions = [
  { value: 1, label: "Q1 (Jan-Mar)" },
  { value: 2, label: "Q2 (Apr-Jun)" },
  { value: 3, label: "Q3 (Jul-Sep)" },
  { value: 4, label: "Q4 (Oct-Dec)" },
];

const dayOptions = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const nationalityOptions = [
  { value: "", label: "Select your citizenship" },
  { value: "United States", label: "United States" },
  { value: "Australia", label: "Australia" },
  { value: "Singapore", label: "Singapore" },
  { value: "Chile", label: "Chile" },
];

const caseStatusOptions = [
  { value: "CERTIFIED", label: "Approved" },
  { value: "DENIED", label: "Not Approved" },
];
const lcaRequiredVisaTypes = new Set(["H-1B", "E-3 Australian", "H-1B1 Singapore", "H-1B1 Chile"]);
const datasetCoveredVisaTypes = new Set(["H-1B", "E-3 Australian", "H-1B1 Singapore", "H-1B1 Chile"]);

const purposeOptions = [
  { value: "", label: "Select purpose" },
  { value: "work", label: "Specialty occupation work in the U.S." },
];

const heroImageSrc = "/static/images/visa-hero.svg";
const resultImageSrc = "/static/images/result-visual.svg";

// FAQ Data
const faqItems = [
  {
    question: "What is the H-1B visa?",
    answer: "The H-1B is a temporary U.S. work visa for foreign professionals in specialty occupations requiring a bachelor's degree or higher. Common fields include IT, engineering, finance, and consulting. Processing typically ranges from 2-8 months depending on the fiscal year and case specifics."
  },
  {
    question: "How accurate are these predictions?",
    answer: "Our model is trained on historical visa processing data and is strongest for H-1B cases (R² ~0.56). For other visa types, the prediction is directional and should be supplemented with official USCIS processing time estimates. Actual times vary based on case complexity and administrative workload."
  },
  {
    question: "What does the LCA status mean in this form?",
    answer: "LCA (Labor Condition Application) is an employer filing step for work-visa processing. In this form we keep it simple for applicants: Approved means the LCA was certified, and Not Approved means it was rejected or not approved yet."
  },
  {
    question: "Which visa type is easiest to get?",
    answer: "There is no universal 'easiest' route. Eligibility depends on your profile, job offer, nationality, and legal criteria. This tool currently models dataset-covered work-visa classes only; consult official USCIS guidance and legal counsel for case-specific decisions."
  },
  {
    question: "Can I apply for multiple visa types simultaneously?",
    answer: "Policy varies. Generally, you can have multiple visa applications in process, but you must maintain status in one while waiting. Consult with your employer's immigration counsel before applying to multiple visa categories."
  },
  {
    question: "Who are the other three visa types for?",
    answer: "E-3 is for Australian citizens in specialty occupations. H-1B1 Singapore is for citizens of Singapore, and H-1B1 Chile is for citizens of Chile, both under free-trade visa programs. All three are employer-sponsored work routes."
  },
  {
    question: "What should I do after receiving my prediction?",
    answer: "Use the prediction as a planning timeline, not a guarantee. Check USCIS official processing times, prepare your documents per the checklist, communicate with your employer/attorney, and monitor your case status via USCIS receipt numbers."
  },
  {
    question: "Does the submission day of the week matter?",
    answer: "Historically, submission timing can correlate with processing timelines due to governmental workload patterns. Our model incorporates day-of-week signals, but differences are typically small (a few days)."
  },
  {
    question: "Where can I get official USCIS guidance?",
    answer: "Visit www.uscis.gov for official guidance, visa category details, and current processing times. For personalized immigration advice, consult a qualified immigration attorney or accredited representative."
  },
];

// Resources Data
const resourcesList = [
  { icon: "■", title: "USCIS.gov", description: "Official U.S. Citizenship & Immigration Services portal", url: "https://www.uscis.gov" },
  { icon: "■", title: "USCIS Processing Times", description: "Real-time case processing time estimates by form type", url: "https://www.uscis.gov/field-offices" },
  { icon: "■", title: "State Department Visas", description: "U.S. Department of State visa information and embassy contacts", url: "https://travel.state.gov/content/travel/en/us-visas.html" },
  { icon: "■", title: "USCIS Call Center", description: "Call 1-800-375-5283 for official assistance", url: "https://www.uscis.gov/help/answer" },
  { icon: "■", title: "Case Status Look-up", description: "Check your case status with your receipt number", url: "https://www.uscis.gov/case-status" },
  { icon: "■", title: "Find Immigration Attorney", description: "American Immigration Lawyers Association directory", url: "https://www.aila.org" },
];

// Visa Comparison Data
const visaComparisonData = [
  { type: "H-1B", purpose: "Specialty Occupation Work", sponsorRequired: true, avgDays: "11.3 avg (P10-P90: 4-7)", difficulty: "Medium" },
  { type: "E-3 Australian", purpose: "Australian Specialty Worker", sponsorRequired: true, avgDays: "10.9 avg (P10-P90: 4-7)", difficulty: "Medium" },
  { type: "H-1B1 Singapore", purpose: "Singapore Specialty Worker", sponsorRequired: true, avgDays: "14.1 avg (P10-P90: 4-7)", difficulty: "Low" },
  { type: "H-1B1 Chile", purpose: "Chile Specialty Worker", sponsorRequired: true, avgDays: "8.9 avg (P10-P90: 4-7)", difficulty: "Low" },
];

// Component for authentic data-driven predictions visualization
function PredictionContextVisualization({ formData, prediction, darkMode }) {
  const [contextData, setContextData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const predictedDays = prediction?.prediction?.predicted_days ?? null;
  const predictedMin = prediction?.prediction?.range_min ?? null;
  const predictedMax = prediction?.prediction?.range_max ?? null;

  React.useEffect(() => {
    if (!formData || !prediction) {
      setLoading(false);
      return;
    }

    // Fetch authentic context data from backend
    const fetchContext = async () => {
      try {
        const response = await fetch('/api/prediction-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_status: formData.case_status,
            visa_type: formData.visa_type || 'H-1B',
            submission_month: formData.submission_month,
            case_year: formData.case_year
          })
        });

        if (!response.ok) throw new Error('Failed to fetch context');
        const result = await response.json();
        setContextData(result.context);
      } catch (err) {
        console.error('Context fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [formData, prediction]);

  if (loading) {
    return (
      <div className={`rounded-xl border ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"} p-4 transition-colors duration-300`}>
        <p className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Historical Context Analysis</p>
        <div className="mt-4 flex items-center justify-center h-32">
          <p className={`text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading historical data...</p>
        </div>
      </div>
    );
  }

  if (error || !contextData) {
    const confidenceSpan =
      predictedMin != null && predictedMax != null ? Math.max(0, predictedMax - predictedMin) : null;

    return (
      <div className={`rounded-xl border ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"} p-4 transition-colors duration-300`}>
        <p className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Prediction Conclusions</p>
        <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>
          {error
            ? "Historical dataset context is unavailable in this environment. Showing model-based numeric conclusions."
            : "Historical context is not available for this selection yet. Showing model-based numeric conclusions."}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className={`rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
            <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Predicted Days</p>
            <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-cyan-400" : "text-cyan-700"}`}>{predictedDays ?? 'N/A'}</p>
          </div>
          <div className={`rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
            <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Expected Window</p>
            <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-purple-400" : "text-purple-700"}`}>
              {predictedMin ?? 'N/A'}-{predictedMax ?? 'N/A'}d
            </p>
          </div>
          <div className={`rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
            <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Confidence Span</p>
            <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-orange-400" : "text-orange-700"}`}>{confidenceSpan ?? 'N/A'} days</p>
          </div>
        </div>

        <div className={`mt-3 rounded-lg p-3 ${darkMode ? "bg-slate-700/30" : "bg-slate-50"} transition-colors duration-300`}>
          <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Summary</p>
          <ul className={`mt-2 space-y-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            <li>Estimated processing timeline: <strong>{predictedDays ?? 'N/A'} days</strong>.</li>
            <li>Expected range for planning: <strong>{predictedMin ?? 'N/A'} to {predictedMax ?? 'N/A'} days</strong>.</li>
            <li>Use this estimate with USCIS updates for final decision timelines.</li>
          </ul>
        </div>
      </div>
    );
  }

  const similar = contextData.similar_cases;
  const monthlyTrend = contextData.monthly_trend;
  const currentMonth = formData.submission_month ? parseInt(formData.submission_month) : null;
  const monthTrendData = currentMonth && monthlyTrend ? monthlyTrend[currentMonth.toString()] : null;

  const monthlySeries = monthlyTrend
    ? Object.entries(monthlyTrend)
        .map(([month, stats]) => ({
          month: parseInt(month),
          value: stats && stats.median != null ? Number(stats.median) : null,
        }))
        .sort((a, b) => a.month - b.month)
    : [];

  const monthlyValues = monthlySeries
    .filter((d) => d.value != null && !Number.isNaN(d.value))
    .map((d) => d.value);

  const trendMin = monthlyValues.length ? Math.min(...monthlyValues) : 0;
  const trendMax = monthlyValues.length ? Math.max(...monthlyValues) : 1;
  const trendRange = Math.max(1, trendMax - trendMin);

  const trendPolyline = monthlySeries
    .map((d, idx) => {
      const x = monthlySeries.length > 1 ? (idx / (monthlySeries.length - 1)) * 100 : 50;
      const y = d.value == null ? 50 : 100 - ((d.value - trendMin) / trendRange) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const bandMin = similar?.percentile_10 ?? null;
  const bandMax = similar?.percentile_90 ?? null;
  const bandRange = bandMin != null && bandMax != null ? Math.max(1, bandMax - bandMin) : 1;
  const predictedOffset =
    predictedDays != null && bandMin != null && bandMax != null
      ? Math.max(0, Math.min(100, ((predictedDays - bandMin) / bandRange) * 100))
      : 50;

  return (
    <div className={`rounded-xl border ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"} p-4 transition-colors duration-300`}>
      <p className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Historical Context Analysis</p>
      <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"} mt-1`}>Real data from {similar?.count?.toLocaleString() || 'N/A'} similar historical cases</p>
      
      {similar && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
            <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Historical Median</p>
            <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`}>{similar.median.toFixed(0)} days</p>
            <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>50th percentile</p>
          </div>
          
          <div className={`rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
            <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Historical Mean</p>
            <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-purple-400" : "text-purple-600"}`}>{similar.mean.toFixed(1)} days</p>
            <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Average processing</p>
          </div>
          
          <div className={`rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
            <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>90th Percentile</p>
            <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-orange-400" : "text-orange-600"}`}>{similar.percentile_90.toFixed(0)} days</p>
            <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Slower cases</p>
          </div>
          
          <div className={`rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
            <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Range</p>
            <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-green-400" : "text-green-600"}`}>{similar.min.toFixed(0)}-{similar.max.toFixed(0)} days</p>
            <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Min to max</p>
          </div>
        </div>
      )}

      {monthTrendData && (
        <div className={`mt-4 rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
          <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Your Submission Month (Month {currentMonth})</p>
          <div className="mt-2 flex justify-between items-end h-16">
            <div>
              <p className={`text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{monthTrendData.avg ? monthTrendData.avg.toFixed(1) : 'N/A'} days avg</p>
              <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{monthTrendData.count} similar cases</p>
            </div>
          </div>
        </div>
      )}

      {similar && (
        <div className={`mt-4 rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
          <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Predicted Days vs Historical Band (P10-P90)</p>
          <div className="mt-3">
            <div className={`relative h-4 rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
              <div className="absolute left-0 top-0 h-4 w-full rounded-full bg-gradient-to-r from-green-400 via-cyan-500 to-orange-400" />
              <div
                className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-4 border-white bg-slate-900 shadow-md"
                style={{ left: `calc(${predictedOffset}% - 12px)` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className={darkMode ? "text-slate-400" : "text-slate-600"}>P10: {similar.percentile_10.toFixed(0)}d</span>
              <span className={darkMode ? "text-slate-400" : "text-slate-600"}>Pred: {predictedDays}d</span>
              <span className={darkMode ? "text-slate-400" : "text-slate-600"}>P90: {similar.percentile_90.toFixed(0)}d</span>
            </div>
          </div>
        </div>
      )}

      {monthlySeries.length > 0 && (
        <div className={`mt-4 rounded-lg p-3 ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} transition-colors duration-300`}>
          <p className={`text-xs uppercase tracking-wide font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Historical Monthly Median Trend (Authentic)</p>
          <div className="mt-3">
            <svg viewBox="0 0 100 100" className="h-24 w-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke={darkMode ? "#22d3ee" : "#0891b2"}
                strokeWidth="2"
                points={trendPolyline}
              />
              {currentMonth && currentMonth >= 1 && currentMonth <= 12 ? (
                <circle
                  cx={monthlySeries.length > 1 ? ((currentMonth - 1) / (monthlySeries.length - 1)) * 100 : 50}
                  cy={(() => {
                    const current = monthlySeries.find((d) => d.month === currentMonth);
                    if (!current || current.value == null) return 50;
                    return 100 - ((current.value - trendMin) / trendRange) * 100;
                  })()}
                  r="2.4"
                  fill={darkMode ? "#f97316" : "#ea580c"}
                />
              ) : null}
            </svg>
            <div className="mt-2 flex justify-between text-xs">
              <span className={darkMode ? "text-slate-400" : "text-slate-600"}>Jan</span>
              <span className={darkMode ? "text-slate-400" : "text-slate-600"}>Median range: {trendMin.toFixed(1)}-{trendMax.toFixed(1)}d</span>
              <span className={darkMode ? "text-slate-400" : "text-slate-600"}>Dec</span>
            </div>
          </div>
        </div>
      )}

      <p className={`text-xs mt-4 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>
        💡 <strong>Insight:</strong> Your prediction of <strong>{prediction?.prediction?.predicted_days}</strong> days is based on the model, contextualized with historical data from {similar?.count?.toLocaleString() || 'similar'} {formData.case_status} {formData.visa_type} cases. Historical median is <strong>{similar?.median}</strong> days.
      </p>
    </div>
  );
}

function SectionCard({ title, subtitle, icon = "", tone = "slate", children, darkMode = false }) {
  const toneMap = {
    light: {
      slate: "from-slate-50 to-white border-slate-200/90",
      cyan: "from-cyan-50/70 to-white border-cyan-200/70",
      orange: "from-orange-50/70 to-white border-orange-200/70",
      ink: "from-slate-100 to-white border-slate-300/80",
      purple: "from-purple-50/70 to-white border-purple-200/70",
      green: "from-green-50/70 to-white border-green-200/70",
    },
    dark: {
      slate: "from-slate-800 to-slate-700/50 border-slate-700",
      cyan: "from-slate-800 to-slate-800/50 border-slate-700",
      orange: "from-slate-800 to-slate-800/50 border-slate-700",
      ink: "from-slate-800 to-slate-700/50 border-slate-700",
      purple: "from-slate-800 to-slate-800/50 border-slate-700",
      green: "from-slate-800 to-slate-800/50 border-slate-700",
    }
  };

  const toneClass = darkMode ? toneMap.dark[tone] || toneMap.dark.slate : toneMap.light[tone] || toneMap.light.slate;

  return (
    <section className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}>
      <div className="mb-4 flex items-start gap-0">
        <div>
          <h2 className={`font-display text-2xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>{title}</h2>
        </div>
      </div>
      <div>
        {subtitle ? <p className={`text-base ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Checklist({ items, emptyMessage, darkMode = false }) {
  if (!items || items.length === 0) {
    return <p className={`text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className={`flex items-start gap-2 text-base ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
          <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-lagoon" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// FAQ Accordion Component
function FAQAccordion({ darkMode = false }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-2">
      {faqItems.map((item, idx) => (
        <div key={idx} className={`rounded-xl border ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"} transition-all duration-300 hover:shadow-sm`}>
          <button
            onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
            className={`w-full px-5 py-4 text-left flex items-center justify-between transition-colors ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"}`}
          >
            <span className={`font-semibold text-base ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{item.question}</span>
            <span className={`text-xl transition-transform duration-300 ${openIndex === idx ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
          {openIndex === idx && (
            <div className={`border-t px-5 py-4 text-base animate-in fade-in duration-300 ${darkMode ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Visa Comparison Matrix Component
function VisaComparisonMatrix({ darkMode = false }) {
  const [sortBy, setSortBy] = useState("type");

  const sortedData = useMemo(() => {
    const copy = [...visaComparisonData];
    if (sortBy === "type") return copy.sort((a, b) => a.type.localeCompare(b.type));
    if (sortBy === "days") return copy.sort((a, b) => parseInt(a.avgDays) - parseInt(b.avgDays));
    if (sortBy === "difficulty") {
      const diffMap = { Low: 1, Medium: 2, High: 3 };
      return copy.sort((a, b) => diffMap[a.difficulty] - diffMap[b.difficulty]);
    }
    return copy;
  }, [sortBy]);

  const diffColor = (d) => {
    if (d === "Low") return darkMode ? "bg-green-900/30 text-green-300" : "bg-green-50 text-green-900";
    if (d === "Medium") return darkMode ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-50 text-yellow-900";
    if (d === "High") return darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-900";
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSortBy("type")}
          className={`px-4 py-2.5 rounded-lg text-base font-medium transition ${
            sortBy === "type" ? "bg-lagoon text-white" : darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          Sort by Type
        </button>
        <button
          onClick={() => setSortBy("days")}
          className={`px-4 py-2.5 rounded-lg text-base font-medium transition ${
            sortBy === "days" ? "bg-lagoon text-white" : darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          Sort by Speed
        </button>
        <button
          onClick={() => setSortBy("difficulty")}
          className={`px-4 py-2.5 rounded-lg text-base font-medium transition ${
            sortBy === "difficulty" ? "bg-lagoon text-white" : darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          Sort by Difficulty
        </button>
      </div>

      <div className={`overflow-x-auto rounded-xl border ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
        <table className="w-full text-base">
          <thead>
            <tr className={`border-b-2 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`}>
              <th className={`text-left py-3 px-4 font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Visa Type</th>
              <th className={`text-left py-3 px-4 font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Purpose</th>
              <th className={`text-left py-3 px-4 font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Sponsor</th>
              <th className={`text-left py-3 px-4 font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Avg Days</th>
              <th className={`text-left py-3 px-4 font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={idx} className={`border-b transition-colors ${darkMode ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}>
                <td className={`py-3 px-4 font-semibold ${darkMode ? "text-slate-100" : "text-ink"}`}>{row.type}</td>
                <td className={`py-3 px-4 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{row.purpose}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${row.sponsorRequired ? (darkMode ? "bg-orange-900/30 text-orange-300" : "bg-orange-100 text-orange-800") : (darkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800")}`}>
                    {row.sponsorRequired ? "Required" : "Not Required"}
                  </span>
                </td>
                <td className={`py-3 px-4 font-medium ${darkMode ? "text-cyan-300" : "text-cyan-700"}`}>{row.avgDays}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${diffColor(row.difficulty)}`}>
                    {row.difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Statistics Dashboard Component
function StatisticsDashboard({ darkMode = false }) {
  const nonH1BPlotItems = [
    { title: "Non-H1B Median Processing by Visa Class", src: "/static/images/plots/07_non_h1b_median_processing.png" },
    { title: "All Visa Classes Avg Processing (Top by Volume)", src: "/static/images/plots/08_all_visas_avg_processing.png" },
    { title: "Non-H1B Case Status Mix", src: "/static/images/plots/09_non_h1b_case_status_mix.png" },
  ];

  const h1bExclusivePlotItems = [
    { title: "H-1B Monthly Trend (Exclusive)", src: "/static/images/plots/10_h1b_monthly_trend_exclusive.png" },
    { title: "H-1B Wage vs Processing (Exclusive)", src: "/static/images/plots/11_h1b_wage_vs_processing_exclusive.png" },
    { title: "H-1B State Processing (Exclusive)", src: "/static/images/plots/12_h1b_state_processing_exclusive.png" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className={`rounded-xl border p-5 ${darkMode ? "border-cyan-900/50 bg-gradient-to-br from-cyan-900/25 to-blue-900/20" : "border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50"}`}>
          <p className={`text-sm uppercase tracking-wide font-semibold ${darkMode ? "text-cyan-300" : "text-cyan-700"}`}>Avg Processing Time</p>
          <p className="text-3xl font-bold text-cyan-900 mt-2">11.3 days</p>
          <p className={`text-sm mt-1 ${darkMode ? "text-cyan-200" : "text-cyan-700"}`}>Mean for H-1B rows in dataset</p>
        </div>
        
        <div className={`rounded-xl border p-5 ${darkMode ? "border-orange-900/50 bg-gradient-to-br from-orange-900/25 to-red-900/20" : "border-orange-200 bg-gradient-to-br from-orange-50 to-red-50"}`}>
          <p className={`text-sm uppercase tracking-wide font-semibold ${darkMode ? "text-orange-300" : "text-orange-700"}`}>Fastest Mean</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">H-1B1 Chile</p>
          <p className={`text-sm mt-1 ${darkMode ? "text-orange-200" : "text-orange-700"}`}>8.9 days average</p>
        </div>
        
        <div className={`rounded-xl border p-5 ${darkMode ? "border-green-900/50 bg-gradient-to-br from-green-900/25 to-emerald-900/20" : "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"}`}>
          <p className={`text-sm uppercase tracking-wide font-semibold ${darkMode ? "text-green-300" : "text-green-700"}`}>Most Common</p>
          <p className="text-3xl font-bold text-green-900 mt-2">H-1B</p>
          <p className={`text-sm mt-1 ${darkMode ? "text-green-200" : "text-green-700"}`}>97.7% of these 4 visa-class rows</p>
        </div>
      </div>

      <div className={`rounded-xl border p-5 space-y-4 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
        <h3 className={`font-semibold text-lg ${darkMode ? "text-slate-100" : "text-slate-800"}`}>Processing Time Ranges (Dataset-Covered Visas)</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>H-1B</span>
              <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>P10-P90: 4-7 days (avg 11.3)</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-2/5 bg-gradient-to-r from-lagoon to-cyan-400 rounded-full"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>E-3 Australian</span>
              <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>P10-P90: 4-7 days (avg 10.9)</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-2/5 bg-gradient-to-r from-sunrise to-orange-400 rounded-full"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>H-1B1 Singapore</span>
              <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>P10-P90: 4-7 days (avg 14.1)</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-2/5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>H-1B1 Chile</span>
              <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>P10-P90: 4-7 days (avg 8.9)</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-2/5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900" : "border-blue-200 bg-blue-50"}`}>
        <p className={`text-base ${darkMode ? "text-slate-200" : "text-blue-900"}`}>
          <strong>Insight:</strong> Processing times are influenced by fiscal year, case complexity, background checks, and administrative workload. Times shown are historical averages and can vary significantly.
        </p>
      </div>

      <div className={`rounded-xl border p-5 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
        <h3 className={`mb-4 font-semibold text-lg ${darkMode ? "text-slate-100" : "text-slate-800"}`}>Non-H1B + Multi-Visa Visuals (Matplotlib)</h3>
        <p className={`mb-4 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Charts generated via matplotlib using non-H1B and cross-visa records.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {nonH1BPlotItems.map((plot) => (
            <div key={plot.src} className={`overflow-hidden rounded-xl border ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
              <img src={plot.src} alt={plot.title} className="w-full object-cover" loading="lazy" />
              <div className="px-4 py-3">
                <p className={`text-base font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{plot.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-xl border p-5 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
        <h3 className={`mb-4 font-semibold text-lg ${darkMode ? "text-slate-100" : "text-slate-800"}`}>H-1B Exclusive Visuals (Matplotlib)</h3>
        <p className={`mb-4 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Dedicated H-1B analytics charts generated separately from the broader visa set.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {h1bExclusivePlotItems.map((plot) => (
            <div key={plot.src} className={`overflow-hidden rounded-xl border ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
              <img src={plot.src} alt={plot.title} className="w-full object-cover" loading="lazy" />
              <div className="px-4 py-3">
                <p className={`text-base font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{plot.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Resources Hub Component
function ResourcesHub({ darkMode = false }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {resourcesList.map((resource, idx) => (
          <a
            key={idx}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 block group border-t-4 border-t-lagoon ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}
          >
            <p className={`font-semibold text-lg transition-colors group-hover:text-lagoon ${darkMode ? "text-slate-100" : "text-ink"}`}>{resource.title}</p>
            <p className={`text-base mt-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{resource.description}</p>
            <p className="text-sm text-lagoon font-medium mt-3 flex items-center gap-1">
              Visit Resource →
            </p>
          </a>
        ))}
      </div>

      <div className={`rounded-xl border-2 border-dashed p-5 text-center ${darkMode ? "border-slate-600 bg-slate-900" : "border-slate-300 bg-slate-50"}`}>
        <p className={`text-base ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
          <strong>Important:</strong> This tool provides estimates for planning purposes only. For binding legal advice and immigration assistance, consult a qualified immigration attorney licensed in the United States.
        </p>
      </div>
    </div>
  );
}

function buildRecommendation(profile, availableTypes) {
  const nationalityPriority = {
    "United States": ["H-1B", "E-3 Australian", "H-1B1 Singapore", "H-1B1 Chile"],
    "Australia": ["E-3 Australian", "H-1B", "H-1B1 Singapore", "H-1B1 Chile"],
    "Singapore": ["H-1B1 Singapore", "H-1B", "E-3 Australian", "H-1B1 Chile"],
    "Chile": ["H-1B1 Chile", "H-1B", "E-3 Australian", "H-1B1 Singapore"],
  };

  const availableVisaTypes = new Set(availableTypes.map((item) => item.visa_type));
  const orderedVisaTypes = nationalityPriority[profile.nationality] || ["H-1B", "E-3 Australian", "H-1B1 Singapore", "H-1B1 Chile"];

  return orderedVisaTypes
    .filter((visaType) => availableVisaTypes.has(visaType))
    .map((visaType, index) => ({
      visaType,
      score: orderedVisaTypes.length - index,
    }));
}

function App() {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = currentYear; year >= 2015; year -= 1) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  const [tab, setTab] = useState("predictor");
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const themeParam = new URLSearchParams(window.location.search).get("theme");
      if (themeParam === "dark") {
        return true;
      }
      if (themeParam === "light") {
        return false;
      }
      return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
    } catch (error) {
      return false;
    }
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [visaTypes, setVisaTypes] = useState([]);
  const [selectedVisaType, setSelectedVisaType] = useState("H-1B");
  const [guidance, setGuidance] = useState(null);

  const [formData, setFormData] = useState({
    nationality: "",
    case_status: "",
    submission_month: "",
    submission_quarter: "",
    submission_dayofweek: "",
    case_year: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [profile, setProfile] = useState({
    nationality: "",
  });
  const [recommendations, setRecommendations] = useState([]);

  const selectedVisaMeta = useMemo(
    () => visaTypes.find((item) => item.visa_type === selectedVisaType) || null,
    [visaTypes, selectedVisaType]
  );
  const canPredictSelectedVisa = Boolean(selectedVisaMeta?.has_direct_training_data);
  const requiresLcaStatus = lcaRequiredVisaTypes.has(selectedVisaType);

  useEffect(() => {
    async function loadVisaTypes() {
      try {
        // Pass nationality as query parameter to filter visa types
        const nationality = formData.nationality ? `?nationality=${encodeURIComponent(formData.nationality)}` : "";
        const response = await fetch(`/api/visa-types${nationality}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load visa types");
        }

        const rawTypes = data.visa_types || [];
        const datasetTypes = rawTypes.filter((item) => datasetCoveredVisaTypes.has(item.visa_type));
        const predictionTypes = rawTypes.filter((item) => item.has_direct_training_data);
        const types = datasetTypes.length > 0 ? datasetTypes : (predictionTypes.length > 0 ? predictionTypes : rawTypes);
        setVisaTypes(types);

        if (types.length > 0) {
          const hasH1B = types.some((t) => t.visa_type === "H-1B");
          setSelectedVisaType(hasH1B ? "H-1B" : types[0].visa_type);
        }
      } catch (err) {
        setApiError(err.message || "Unable to load visa types");
      } finally {
        setIsLoadingTypes(false);
      }
    }

    loadVisaTypes();
  }, [formData.nationality]);

  useEffect(() => {
    if (!selectedVisaType) {
      return;
    }

    async function loadGuidance() {
      setIsLoadingGuidance(true);
      setApiError("");
      try {
        const response = await fetch(`/api/visa-guidance?visa_type=${encodeURIComponent(selectedVisaType)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load guidance");
        }
        setGuidance(data);
      } catch (err) {
        setApiError(err.message || "Unable to load guidance");
      } finally {
        setIsLoadingGuidance(false);
      }
    }

    loadGuidance();
  }, [selectedVisaType]);

  function updateField(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  }

  function validateForm() {
    if (!canPredictSelectedVisa) {
      setApiError(
        `${selectedVisaType} does not have direct training dataset coverage for prediction. Use guidance/checklists and official USCIS timelines.`
      );
      return false;
    }

    const nextErrors = {};
    const requiredKeys = ["submission_month", "submission_quarter", "submission_dayofweek", "case_year"];
    if (requiresLcaStatus) {
      requiredKeys.unshift("case_status");
    }

    requiredKeys.forEach((key) => {
      if (!String(formData[key]).trim()) {
        nextErrors[key] = "This field is required";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function runRecommendation() {
    const ranking = buildRecommendation(profile, visaTypes);
    setRecommendations(ranking);
    if (ranking.length > 0) {
      setSelectedVisaType(ranking[0].visaType);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");
    setPrediction(null);

    try {
      const payload = {
        visa_type: selectedVisaType,
        case_status: requiresLcaStatus ? formData.case_status : "CERTIFIED",
        submission_month: Number(formData.submission_month),
        submission_quarter: Number(formData.submission_quarter),
        submission_dayofweek: Number(formData.submission_dayofweek),
        case_year: Number(formData.case_year),
      };

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      setPrediction(data);
    } catch (err) {
      setApiError(err.message || "Prediction failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const resultRange = prediction
    ? Math.max(1, Number(prediction.prediction.range_max) - Number(prediction.prediction.range_min))
    : 1;

  const markerOffset = prediction
    ? Math.max(
        0,
        Math.min(
          100,
          ((Number(prediction.prediction.predicted_days) - Number(prediction.prediction.range_min)) / resultRange) * 100
        )
      )
    : 50;

  const navTabs = [
    { id: "predictor", label: "Predictor" },
    { id: "compare", label: "Comparison" },
    { id: "faq", label: "FAQ & Tips" },
    { id: "stats", label: "Statistics" },
    { id: "resources", label: "Resources" },
  ];

  useEffect(() => {
    const validTabIds = new Set(navTabs.map((item) => item.id));

    function syncTabFromHash() {
      const hashTab = window.location.hash.replace(/^#/, "").trim().toLowerCase();
      if (hashTab && validTabIds.has(hashTab)) {
        setTab(hashTab);
      }
    }

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);

    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [tab]);

  useEffect(() => {
    if (window.location.hash !== `#${tab}`) {
      window.history.replaceState(null, "", `#${tab}`);
    }
  }, [tab]);

  useEffect(() => {
    try {
      const themeValue = darkMode ? "dark" : "light";
      window.localStorage.setItem(THEME_STORAGE_KEY, themeValue);

      const nextUrl = new URL(window.location.href);
      if (nextUrl.searchParams.get("theme") !== themeValue) {
        nextUrl.searchParams.set("theme", themeValue);
        window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
      }
    } catch (error) {
      // Ignore storage/URL update issues in restricted browser contexts.
    }
  }, [darkMode]);

  return (
    <main className={`flex min-h-screen flex-col lg:flex-row ${darkMode ? "bg-slate-950" : "bg-gradient-to-br from-paper via-orange-50 to-cyan-50"} font-body transition-colors duration-300`}>
      <a href="#main-content" className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 ${darkMode ? "focus:bg-slate-800 focus:text-white" : "focus:bg-white focus:text-slate-900"}`}>
        Skip to main content
      </a>
      <div className={`pointer-events-none fixed -left-24 top-4 h-56 w-56 rounded-full ${darkMode ? "bg-slate-700/15" : "bg-cyan-200/25"} blur-3xl`} />
      <div className={`pointer-events-none fixed -right-16 top-24 h-64 w-64 rounded-full ${darkMode ? "bg-slate-700/15" : "bg-orange-200/30"} blur-3xl`} />
      <div className={`pointer-events-none fixed bottom-6 right-24 h-44 w-44 rounded-full ${darkMode ? "bg-slate-700/10" : "bg-sky-300/20"} blur-3xl`} />

      <aside className={`hidden lg:block lg:w-72 ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"} border-r shadow-sm overflow-y-auto transition-colors duration-300`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-ink"}`}>Navigation</h2>
          <div className="mt-6 space-y-2">
            {navTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full px-4 py-3 rounded-lg text-base font-medium text-left transition-all ${
                  tab === t.id
                    ? "bg-lagoon text-white shadow-md"
                    : darkMode
                    ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className={`border-t ${darkMode ? "border-slate-700" : "border-slate-200"} p-6`}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full px-4 py-3 rounded-lg text-base font-medium transition ${
              darkMode
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "bg-slate-200 text-slate-800 hover:bg-slate-300"
            }`}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>

      <div className={`flex-1 ${darkMode ? "text-slate-100" : "text-ink"} transition-colors duration-300`}>
        <div className="px-4 pt-4 lg:hidden">
          <div className={`rounded-2xl border ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"} p-3 shadow-sm`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Visa Navigator</p>
                <p className={`text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{navTabs.find((t) => t.id === tab)?.label || "Predictor"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${darkMode ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-800"}`}
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? "Light" : "Dark"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen((prev) => !prev)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${darkMode ? "bg-cyan-700 text-white" : "bg-cyan-600 text-white"}`}
                  aria-expanded={isMobileNavOpen}
                  aria-controls="mobile-nav-menu"
                >
                  Menu
                </button>
              </div>
            </div>

            {isMobileNavOpen ? (
              <div id="mobile-nav-menu" className="mt-3 grid gap-2">
                {navTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                      tab === t.id
                        ? "bg-lagoon text-white"
                        : darkMode
                        ? "bg-slate-800 text-slate-300"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div id="main-content" className="relative mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 [&_select]:min-h-[48px] [&_select]:py-2.5 [&_select]:text-base [&_select]:leading-6 [&_option]:text-base">
          <header className={`mb-6 overflow-hidden rounded-3xl border ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"} p-8 shadow-sm transition-colors duration-300`}>
            <div className="grid items-center gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <h1 className={`font-display text-4xl font-bold tracking-tight ${darkMode ? "text-white" : "text-ink"} sm:text-5xl`}>
                  Visa Navigator & Processing Estimator
                </h1>
                <p className={`mt-3 max-w-3xl text-lg ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Explore visa options, compare processing times, and estimate your timeline with ML-powered predictions.
                </p>
              </div>
              <div className="hidden lg:col-span-4 lg:block">
                <div className={`rounded-2xl border p-2 backdrop-blur-sm ${darkMode ? "border-slate-700/70 bg-slate-700/30" : "border-white/70 bg-white/70"}`}>
                  <img
                    src={heroImageSrc}
                    alt="Visa planning illustration"
                    className="min-h-[170px] w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="mb-8 grid gap-3 sm:grid-cols-4 animate-in fade-in duration-500">
            <div className={`rounded-2xl border ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"} p-4 shadow-sm transition-colors duration-300`}>
              <p className={`text-sm uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Visa Types</p>
              <p className={`mt-1 font-display text-3xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>{visaTypes.length || "-"}</p>
            </div>
            <div className={`rounded-2xl border ${darkMode ? "border-cyan-900/50 bg-cyan-900/20" : "border-cyan-200 bg-cyan-50/70"} p-4 shadow-sm transition-colors duration-300`}>
              <p className={`text-sm uppercase tracking-wide ${darkMode ? "text-cyan-400" : "text-cyan-700"}`}>Selected</p>
              <p className={`mt-1 font-display text-3xl font-semibold ${darkMode ? "text-cyan-300" : "text-cyan-900"}`}>{selectedVisaType || "-"}</p>
            </div>
            <div className={`rounded-2xl border ${darkMode ? "border-orange-900/50 bg-orange-900/20" : "border-orange-200 bg-orange-50/70"} p-4 shadow-sm transition-colors duration-300`}>
              <p className={`text-sm uppercase tracking-wide ${darkMode ? "text-orange-400" : "text-orange-700"}`}>Year Range</p>
              <p className={`mt-1 font-display text-3xl font-semibold ${darkMode ? "text-orange-300" : "text-orange-900"}`}>2015-{currentYear}</p>
            </div>
            <div className={`rounded-2xl border ${darkMode ? "border-purple-900/50 bg-purple-900/20" : "border-purple-200 bg-purple-50/70"} p-4 shadow-sm transition-colors duration-300`}>
              <p className={`text-sm uppercase tracking-wide ${darkMode ? "text-purple-400" : "text-purple-700"}`}>Model Status</p>
              <p className={`mt-1 font-display text-base font-semibold ${darkMode ? "text-purple-300" : "text-purple-900"}`}>Active</p>
            </div>
          </div>

          {apiError ? (
            <div className={`mb-6 rounded-xl border ${darkMode ? "border-red-900/50 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-700"} px-4 py-3 text-base transition-colors duration-300`}>
              {apiError}
            </div>
          ) : null}

          {tab === "predictor" && (
            <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in duration-500">
              <div className="space-y-6 lg:col-span-5">
                <SectionCard title="Which Visa Type Fits You?" subtitle="Select your citizenship to get a guided visa type suggestion." icon="●" tone="orange" darkMode={darkMode}>
                  <div className="space-y-3">
                    <div>
                      <label className={`mb-2 block text-base font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Your Citizenship / Nationality</label>
                      <select value={profile.nationality} onChange={(e) => setProfile((prev) => ({ ...prev, nationality: e.target.value }))} className={`w-full rounded-lg border px-3 py-2.5 text-base focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/20 ${darkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-300 bg-white"}`}>
                        {nationalityOptions.map((nat) => (
                          <option key={nat.value} value={nat.value}>{nat.label}</option>
                        ))}
                      </select>
                      <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        This is the main filter. The four dataset-covered visa types stay available, but the order changes based on citizenship.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button type="button" onClick={runRecommendation} className="rounded-lg bg-sunrise px-5 py-3 text-base font-semibold text-white transition hover:bg-orange-600">Recommend Visa Type</button>
                      <p className={`text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>This is guidance only, not legal advice.</p>
                    </div>
                    {recommendations.length > 0 ? (
                      <div className={`rounded-xl border p-3 ${darkMode ? "border-orange-900/50 bg-orange-900/20" : "border-orange-200 bg-orange-50"}`}>
                        <p className={`text-base font-medium ${darkMode ? "text-orange-300" : "text-orange-800"}`}>Suggested for {profile.nationality || "your profile"}: <span className="font-bold">{recommendations[0].visaType}</span></p>
                        <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                          The four dataset-covered visa types remain available in the selector, but this recommendation highlights only the best match.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </SectionCard>

                <SectionCard title="Select Visa Type" subtitle="Pick the visa type first to unlock tailored guidance." icon="●" tone="cyan" darkMode={darkMode}>
                  {isLoadingTypes ? (
                    <p className={`text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading visa options...</p>
                  ) : (
                    <div className="space-y-3">
                      <label className={`block text-base font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`} htmlFor="visaType">Visa Type</label>
                      <select id="visaType" value={selectedVisaType} onChange={(e) => setSelectedVisaType(e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 text-base focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/20 ${darkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-300 bg-white"}`}>
                        {visaTypes.map((type) => (
                          <option key={type.visa_type} value={type.visa_type}>{type.visa_type}</option>
                        ))}
                      </select>
                      {formData.nationality && selectedVisaType === 'E-3 Australian' && formData.nationality !== 'Australia' ? (
                        <div className={`mt-2 rounded-lg border px-3 py-2 text-sm ${darkMode ? "border-red-800/50 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-800"}`}>
                          ⚠️ <strong>Eligibility Issue:</strong> E-3 Australian visa is only available to Australian citizens. You selected {formData.nationality}.
                        </div>
                      ) : null}
                      {formData.nationality && selectedVisaType === 'H-1B1 Singapore' && formData.nationality !== 'Singapore' ? (
                        <div className={`mt-2 rounded-lg border px-3 py-2 text-sm ${darkMode ? "border-red-800/50 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-800"}`}>
                          ⚠️ <strong>Eligibility Issue:</strong> H-1B1 Singapore visa is only available to Singapore citizens. You selected {formData.nationality}.
                        </div>
                      ) : null}
                      {formData.nationality && selectedVisaType === 'H-1B1 Chile' && formData.nationality !== 'Chile' ? (
                        <div className={`mt-2 rounded-lg border px-3 py-2 text-sm ${darkMode ? "border-red-800/50 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-800"}`}>
                          ⚠️ <strong>Eligibility Issue:</strong> H-1B1 Chile visa is only available to Chilean citizens. You selected {formData.nationality}.
                        </div>
                      ) : null}
                      {visaTypes.length > 0 ? (
                        <p className={`text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {visaTypes.find((item) => item.visa_type === selectedVisaType)?.summary || ""}
                        </p>
                      ) : null}
                      {visaTypes.length > 0 ? (
                        <div className={`rounded-lg border px-3 py-2 text-sm ${darkMode ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                          <p className="font-medium">Model Coverage</p>
                          <p className="mt-1">
                            {visaTypes.find((item) => item.visa_type === selectedVisaType)?.coverage_note || "Coverage details unavailable for this visa type."}
                          </p>
                        </div>
                      ) : null}
                      <div className={`rounded-lg border px-3 py-2 text-sm ${darkMode ? "border-cyan-800/50 bg-slate-900 text-slate-300" : "border-cyan-200 bg-cyan-50/40 text-slate-700"}`}>
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold ${darkMode ? "border-cyan-700 text-cyan-300" : "border-cyan-400 text-cyan-700"}`}
                            title="E-3 Australian: Australian citizens; H-1B1 Singapore: Singapore citizens; H-1B1 Chile: Chilean citizens."
                            aria-label="Visa types quick info"
                          >
                            i
                          </span>
                          <p>
                            <strong>Other work visa options:</strong> E-3 Australian (Australian citizens), H-1B1 Singapore (Singapore citizens), and H-1B1 Chile (Chilean citizens).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Eligibility Checklist" subtitle="Quick pre-check before you estimate timelines." icon="✓" tone="slate" darkMode={darkMode}>
                  {isLoadingGuidance ? (
                    <p className={`text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading eligibility checklist...</p>
                  ) : (
                    <Checklist items={guidance?.eligibility} emptyMessage="Select a visa type to view eligibility criteria." darkMode={darkMode} />
                  )}
                </SectionCard>

                <SectionCard title="Document Checklist" subtitle="Prepare these items before filing." icon="■" tone="slate" darkMode={darkMode}>
                  {isLoadingGuidance ? (
                    <p className={`text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading document checklist...</p>
                  ) : (
                    <Checklist items={guidance?.documents} emptyMessage="Select a visa type to view required documents." darkMode={darkMode} />
                  )}
                </SectionCard>
              </div>

              <div className="space-y-6 lg:col-span-7">
                <SectionCard title="Processing Estimator" subtitle="Enter your timeline signals and generate a prediction range." icon="◆" tone="ink" darkMode={darkMode}>
                  {!canPredictSelectedVisa ? (
                    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${darkMode ? "border-amber-700/40 bg-amber-900/20 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                      Prediction is currently disabled for <strong>{selectedVisaType}</strong> because this visa type does not have direct training dataset rows in the current model.
                      You can still use eligibility/document guidance and official USCIS timelines.
                    </div>
                  ) : null}
                  <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
                    {requiresLcaStatus ? (
                    <div className="sm:col-span-2">
                      <div className="mb-2 flex items-center gap-2">
                        <label className={`block text-base font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Labor Condition Application (LCA) Status</label>
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold ${darkMode ? "border-slate-500 text-slate-300" : "border-slate-400 text-slate-600"}`}
                          title="LCA is the employer labor filing step for specialty-work visas. Select Approved if the LCA is certified; otherwise choose Not Approved."
                          aria-label="LCA info"
                        >
                          i
                        </span>
                      </div>
                      <select value={formData.case_status} onChange={(e) => updateField("case_status", e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 text-base focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/20 ${darkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-300 bg-white"}`}>
                        <option value="">Select LCA status</option>
                        {caseStatusOptions.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                      <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        You no longer need to choose internal workflow statuses like Withdrawn or Pending Review.
                      </p>
                      {errors.case_status ? <p className="mt-1 text-sm text-red-600">{errors.case_status}</p> : null}
                    </div>
                    ) : null}
                    <div>
                      <label className={`mb-2 block text-base font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Submission Month</label>
                      <select value={formData.submission_month} onChange={(e) => updateField("submission_month", e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 text-base focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/20 ${darkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-300 bg-white"}`}>
                        <option value="">Select month</option>
                        {monthOptions.map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                      {errors.submission_month ? <p className="mt-1 text-sm text-red-600">{errors.submission_month}</p> : null}
                    </div>
                    <div>
                      <label className={`mb-2 block text-base font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Submission Quarter</label>
                      <select value={formData.submission_quarter} onChange={(e) => updateField("submission_quarter", e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 text-base focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/20 ${darkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-300 bg-white"}`}>
                        <option value="">Select quarter</option>
                        {quarterOptions.map((quarter) => (
                          <option key={quarter.value} value={quarter.value}>{quarter.label}</option>
                        ))}
                      </select>
                      {errors.submission_quarter ? <p className="mt-1 text-sm text-red-600">{errors.submission_quarter}</p> : null}
                    </div>
                    <div>
                      <label className={`mb-2 block text-base font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Submission Day</label>
                      <select value={formData.submission_dayofweek} onChange={(e) => updateField("submission_dayofweek", e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 text-base focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/20 ${darkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-300 bg-white"}`}>
                        <option value="">Select day</option>
                        {dayOptions.map((day) => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                      {errors.submission_dayofweek ? <p className="mt-1 text-sm text-red-600">{errors.submission_dayofweek}</p> : null}
                    </div>
                    <div>
                      <label className={`mb-2 block text-base font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Case Year</label>
                      <select value={formData.case_year} onChange={(e) => updateField("case_year", e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 text-base focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/20 ${darkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-300 bg-white"}`}>
                        <option value="">Select year</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      {errors.case_year ? <p className="mt-1 text-sm text-red-600">{errors.case_year}</p> : null}
                    </div>
                    <div className="sm:col-span-2 mt-2 flex flex-wrap gap-3">
                      <button type="submit" disabled={isSubmitting || !canPredictSelectedVisa} className="rounded-lg bg-ink px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                        {isSubmitting ? "Estimating..." : "Generate Estimate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ nationality: "", case_status: "", submission_month: "", submission_quarter: "", submission_dayofweek: "", case_year: "" });
                          setPrediction(null);
                          setErrors({});
                          setApiError("");
                        }}
                        className={`rounded-lg border ${darkMode ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"} px-5 py-3 text-base font-medium transition-colors duration-300`}
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </SectionCard>

                <SectionCard title="Estimate Result" subtitle="Prediction window and confidence margin from historical trends." icon="◆" tone="cyan" darkMode={darkMode}>
                  {!prediction ? (
                    <div className={`rounded-xl border-2 border-dashed ${darkMode ? "border-slate-600 bg-slate-800/50" : "border-slate-300 bg-white/80"} p-6 transition-colors duration-300`}>
                      <p className={`text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Fill the estimator form and generate a prediction.
                      </p>
                      <img src={resultImageSrc} alt="Prediction visual preview" className={`mt-4 w-full rounded-xl border ${darkMode ? "border-slate-700" : "border-slate-200"}`} loading="lazy" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className={`rounded-xl bg-gradient-to-br ${darkMode ? "from-orange-900/30 to-orange-800/20" : "from-orange-50 to-orange-100"} p-4 transition-colors duration-300`}>
                          <p className={`text-sm uppercase tracking-wide font-medium ${darkMode ? "text-orange-400" : "text-orange-700"}`}>Predicted Days</p>
                          <p className={`text-3xl font-semibold ${darkMode ? "text-orange-300" : "text-orange-900"}`}>{prediction.prediction.predicted_days}</p>
                        </div>
                        <div className={`rounded-xl bg-gradient-to-br ${darkMode ? "from-cyan-900/30 to-cyan-800/20" : "from-cyan-50 to-cyan-100"} p-4 transition-colors duration-300`}>
                          <p className={`text-sm uppercase tracking-wide font-medium ${darkMode ? "text-cyan-400" : "text-cyan-700"}`}>Lower Bound</p>
                          <p className={`text-3xl font-semibold ${darkMode ? "text-cyan-300" : "text-cyan-900"}`}>{prediction.prediction.range_min}</p>
                        </div>
                        <div className={`rounded-xl bg-gradient-to-br ${darkMode ? "from-slate-700 to-slate-600/50" : "from-slate-100 to-slate-200"} p-4 transition-colors duration-300`}>
                          <p className={`text-sm uppercase tracking-wide font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Upper Bound</p>
                          <p className={`text-3xl font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>{prediction.prediction.range_max}</p>
                        </div>
                      </div>
                      <div className={`rounded-xl border ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"} p-4 transition-colors duration-300`}>
                        <p className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Prediction Range Visual</p>
                        <div className="mt-3">
                          <div className={`relative h-3 rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                            <div className="absolute left-0 top-0 h-3 w-full rounded-full bg-gradient-to-r from-cyan-300 via-cyan-500 to-orange-400" />
                            <div className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-4 border-white bg-gradient-to-r from-cyan-400 to-orange-400 shadow-lg transition-all" style={{ left: `calc(${markerOffset}% - 10px)` }} />
                          </div>
                        </div>
                      </div>
                      <PredictionContextVisualization 
                        formData={formData} 
                        prediction={prediction}
                        darkMode={darkMode}
                      />
                      <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                        <p className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Transparency Note</p>
                        <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                          {prediction.scope_note || prediction.coverage_note || "This estimate is generated from available historical model coverage."}
                        </p>
                      </div>
                    </div>
                  )}
                </SectionCard>

              </div>
            </div>
          )}

          {tab === "compare" && (
            <div className="animate-in fade-in duration-500">
              <SectionCard title="Visa Type Comparison Matrix" subtitle="Browse and compare all available visa types side-by-side." icon="◆" tone="purple" darkMode={darkMode}>
                <VisaComparisonMatrix darkMode={darkMode} />
              </SectionCard>
            </div>
          )}

          {tab === "faq" && (
            <div className="animate-in fade-in duration-500">
              <SectionCard title="Frequently Asked Questions & Tips" subtitle="Get answers to common questions about visa processing and our predictions." icon="●" tone="green" darkMode={darkMode}>
                <FAQAccordion darkMode={darkMode} />
              </SectionCard>
            </div>
          )}

          {tab === "stats" && (
            <div className="animate-in fade-in duration-500">
              <SectionCard title="Processing Statistics & Insights" subtitle="Historical data and trends from visa processing cases." icon="◆" tone="cyan" darkMode={darkMode}>
                <StatisticsDashboard darkMode={darkMode} />
              </SectionCard>
            </div>
          )}

          {tab === "resources" && (
            <div className="animate-in fade-in duration-500">
              <SectionCard title="Official Resources & Links" subtitle="Quick access to government agencies and helpful resources." icon="●" tone="orange" darkMode={darkMode}>
                <ResourcesHub darkMode={darkMode} />
              </SectionCard>
            </div>
          )}

          <footer className={`mt-12 rounded-2xl border ${darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-white/50"} p-6 backdrop-blur-sm text-center text-base ${darkMode ? "text-slate-400" : "text-slate-600"} transition-colors duration-300`}>
            <p>
              This tool provides estimates for planning purposes only. Actual processing times vary based on case complexity, administrative workload, and policy changes.
              For legal advice, consult a qualified immigration attorney.
            </p>
            <p className="mt-2">© 2024 Visa Navigator. Data sourced from historical H-1B processing cases.</p>
          </footer>
        </div>
      </div>
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
