import axios from "axios";
import { useEffect, useState } from "react";
import Banner from "../Banner";
import { ArrowLeft, FileSpreadsheet, Power } from "lucide-react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

const QAExamResults = () => {
  const [filters, setFilters] = useState({
    cie: "",
    batch: "",
    examtype: "",
    department: "",
    semester: "",
    regulation: "",
    academicYear: "",
  });

  const [resultData, setResultData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/main-backend/examiner/forms')
        setBatches(res.data.batch)
        setDepartments(res.data.departments)
        setSemesters(res.data.semesters)
        setRegulations(res.data.regulation)
        setAcademicYears(res.data.academic_year)
      } catch (error) {
        console.error("Error fetching the form data",error);
      }
    }
    fetchData();
  }, [])

  const handleFetchResults = async () => {
    if (!filters.batch || !filters.regulation || !filters.academicYear) {
      Swal.fire({
        title: "Missing Filters",
        text: "Please select Batch, Regulation, and Academic Year",
        icon: "warning",
      });
      return;
    }

    setLoading(true);

    const cieMap = {
      "CIE I": "cie1",
      "CIE II": "cie2",
      "CIE III": "cie3",
    };

    // ✅ build payload
    const payload = {
      batch: filters.batch,
      regulation: filters.regulation,
      academic_year: filters.academicYear,
    };

    // ✅ optional fields
    if (filters.cie) payload.cie = cieMap[filters.cie];
    if (filters.department) payload.department = filters.department;
    if (filters.examtype) payload.exam_type = filters.examtype;
    if (filters.semester) payload.semester = filters.semester;

    try {
      const response = await axios.post(
        "/api/main-backend/examiner/results/export",
        payload
      );

      if (response.data.results && response.data.results.length > 0) {
        setResultData(response.data.results);
        Swal.fire({
          title: "Success",
          text: "Results fetched successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        setResultData([]);
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch exam results",
        icon: "error",
      });
    }

    setLoading(false);
  };

  return (
    <>
      <Banner
        backgroundImage="./Banners/examsbanner.webp"
        headerText="office of controller of examinations"
        subHeaderText="COE"
      />

      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between mb-2">
            <button
              className="flex gap-2 justify-center items-center"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <h1 className="text-2xl font-bold text-brwn mb-6">
              Exam Results
            </h1>

            <button
              className="qa-logout-btn"
              onClick={() => {
                sessionStorage.removeItem("userSession");
                navigate("/");
              }}
              title="Log out"
              type="button"
            >
              <Power size={18} />
              <span>Logout</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Select
              label="Regulation"
              options={regulations}
              value={filters.regulation}
              onChange={(v) =>
                setFilters({ ...filters, regulation: v })
              }
            />

            <Select
              label="Academic Year"
              options={academicYears}
              value={filters.academicYear}
              onChange={(v) =>
                setFilters({ ...filters, academicYear: v })
              }
            />

            <Select
              label="Batch"
              options={batches}
              value={filters.batch}
              onChange={(v) =>
                setFilters({ ...filters, batch: v })
              }
            />

            <Select
              label="CIE"
              options={["CIE I", "CIE II", "CIE III"]}
              value={filters.cie}
              onChange={(v) =>
                setFilters({ ...filters, cie: v })
              }
            />

            <Select
              label="Department"
              options={departments}
              value={filters.department}
              onChange={(v) =>
                setFilters({ ...filters, department: v })
              }
            />

            <Select
              label="Exam Type"
              options={["Regular", "Retest", "Arrear"]}
              value={filters.examtype}
              onChange={(v) =>
                setFilters({ ...filters, examtype: v })
              }
            />

            <Select
              label="Semester"
              options={semesters}
              value={filters.semester}
              onChange={(v) =>
                setFilters({ ...filters, semester: v })
              }
            />

            <button
              className="px-4 py-2 bg-secd text-text rounded-md text-sm font-medium hover:bg-brwn hover:text-prim"
              onClick={handleFetchResults}
              disabled={loading}
            >
              {loading ? "Getting..." : "Get Results"}
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gry border-b">
                <tr>
                  <TableHead>S.No</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Total Students</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </tr>
              </thead>

              <tbody>
                {resultData.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-6 text-gray-500"
                    >
                      No results found
                    </td>
                  </tr>
                )}

                {resultData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.department}</TableCell>
                    <TableCell>{item.total_students}</TableCell>
                    <TableCell>{Array.isArray(item.subject) ? item.subject.join("/") : item.subject}</TableCell>
                    <TableCell>{item.cie}</TableCell>
                    <TableCell>{item.semester}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <a href={item.excel_link} className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full text-xs w-fit font-medium cursor-pointer flex items-center" ><FileSpreadsheet size={16} /></a>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-500 mt-4 text-right">
            Showing {resultData.length} result file(s)
          </p>
        </div>
      </div>
    </>
  );
};

/* Reusable Components */

function Select({ label, options, value, onChange }) {
  return (
    <select
      className="w-full p-2.5 border rounded-md bg-prim text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{`Select ${label}`}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function TableHead({ children }) {
  return (
    <th className="px-4 py-3 font-semibold text-text">
      {children}
    </th>
  );
}

function TableCell({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 text-gray-700 ${className}`}>
      {children}
    </td>
  );
}

export default QAExamResults;