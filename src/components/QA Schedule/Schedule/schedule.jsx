import { useState, useMemo, useEffect, useRef } from "react"
import {
  GraduationCap,
  Building2,
  Hash,
  BookOpen,
  Calendar,
  Clock,
  Power,
  ListChecks,
  ListOrdered,
  CalendarRange,
  BookCheck,
} from "lucide-react"
import { Dropdown, MultiSearchDropdown, SearchableInput } from "./searchableInput"
import Banner from "../../Banner"
import { useNavigate } from "react-router"
import Swal from "sweetalert2"
import axios from "axios"

const Schedule = () => {
  const [departments, setDepartments] = useState("")
  const [registerState, setRegisterState] = useState({
    mode: "none", // none | partial | all
    values: [],
  })
  const [regDropdownOpen, setRegDropdownOpen] = useState(false);
  const regRef = useRef(null)
  const [qaSelected, setQaSelected] = useState("")
  const [otherSubjects, setOtherSubjects] = useState("")
  const [violationLimit, setViolationLimit] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [examType, setExamType] = useState("")
  const [semesters, setSemesters ] = useState(["SEM I", "SEM II"])
  const [semester, setSemester] = useState("");  
  const [regulations, setRegulations] = useState([])
  const [regulation, setRegulation] = useState("");
  const [acadamicYears, setAcadamicYears] = useState([]);
  const [acadamicYear, setAcadamicYear] = useState("");
  const [years, setYears] = useState([])
  const [departmentOptions, setDepartmentOptions] = useState([])
  const [studentRegs, setStudentRegs] = useState([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [topics, setTopics] = useState({})
  const [subjectTopics, setSubjectTopics] = useState([])
  const [isRetest, setIsRetest] = useState(false)
  const [isArrear, setIsArrear] = useState(false)
  const [normalBatch, setNormalBatch] = useState("")
  const [retestBatch, setRetestBatch] = useState("")
  const [arrearBatch, setArrearBatch] = useState("")
  const activeBatch = isRetest ? retestBatch : isArrear ? arrearBatch : normalBatch
  const heading = isRetest ? "Retest" : isArrear ? "Arrear" : "Regular"
  const [resetKey, setResetKey] = useState(0)
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeBatch) return

   const fetchStudents = async () => {
  setLoadingRegs(true)

  try {
    const payload = {
      department: departments,
      batch: isRetest ? retestBatch : isArrear ? arrearBatch : normalBatch,
    }

    const url = "/api/main-backend/examiner/forms/register-number"
    const res = await axios.post(url, payload)

    setStudentRegs(res.data.students || [])

    // ✅ ONLY reset in Regular mode
    if (!isRetest && !isArrear) {
      setRegisterState({ mode: "none", values: [] })
    }

  } catch (err) {
    console.error("Failed to fetch students", err)
    setStudentRegs([])
  } finally {
    setLoadingRegs(false)
  }
}


    fetchStudents()
  }, [activeBatch, departments, isRetest, isArrear])

  useEffect(() => {
    // Reset QA / Other subjects and topics when batch changes
    setQaSelected("");
    setOtherSubjects("");
    setTopics({});

    // Reset date, exam type, time, and violation limit when batch changes
    setDate("");
    setExamType("");
    setTime("");
    setViolationLimit("")

  }, [activeBatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/main-backend/examiner/forms")
        const data = res.data
        setYears(data.batch || [])
        setDepartmentOptions(data.departments || "")
        setSubjectTopics(data.subjects || [])
        setAcadamicYears(data.academic_year || [])
        setSemesters(data.semesters || [])
        setRegulations(data.regulation || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const filteredRegs = studentRegs

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (regRef.current && !regRef.current.contains(e.target)) {
        setRegDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Dept changed → reset registers
  useEffect(() => {
    if (isRetest || isArrear) return; 
    setRegisterState({ mode: "none", values: [] })
    setRegDropdownOpen(false);
  }, [departments, isRetest, isArrear])


  // Year changed → reset dept + register
  useEffect(() => {
    setDepartments("")
    setRegDropdownOpen(false);
    setRegisterState({ mode: "none", values: [] })
  }, [activeBatch])

  const qaSubject = useMemo(
    () => subjectTopics.find(s => s.subject_name === "QA")?.subject_name || "",
    [subjectTopics]
  )

  const remainingSubjects = useMemo(
    () =>
      subjectTopics
        .filter(s => s.subject_name !== "QA")
        .map(s => s.subject_name),
    [subjectTopics]
  )

  const selectedSubjects = useMemo(() => {
    const subjects = []
    if (qaSelected) subjects.push(qaSelected)
    if (otherSubjects) subjects.push(otherSubjects)
    return subjects
  }, [qaSelected, otherSubjects])

  const getTopicsForSubject = (sub) => {
    return subjectTopics.find(s => s.subject_name === sub)?.topics || []
  }

  useEffect(() => {
    if (!selectedSubjects.length) {
      setTopics({})
      return
    }

    const initial = {}
    selectedSubjects.forEach(sub => {
      initial[sub] = []
    })

    setTopics(initial)
  }, [selectedSubjects])

  useEffect(() => {
    setNormalBatch("")
    setRetestBatch("")
    setArrearBatch("")
    setStudentRegs([])
    setRegDropdownOpen(false)
    setViolationLimit("")
    setRegulation("")
    setAcadamicYear("")
    setSemester("")
    setResetKey(prev => prev + 1)
  }, [isRetest, isArrear])

  function parseTimeSlot(timeSlot) {
    if (!timeSlot) return { start: "", end: "" }

    const [start, end] = timeSlot.split(" - ")
    return { start, end }
  }

  const submitExamSchedule = async () => {
    if (!activeBatch || !date || !time) {
      await Swal.fire({
        icon: "warning",
        title: "Missing Details",
        text: "Please fill all required fields before submitting.",
        confirmButtonColor: "#800000",
      })
      return
    }

    const numericViolationLimit = Number(violationLimit)

    if (!violationLimit || Number.isNaN(numericViolationLimit) || numericViolationLimit <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Violation Limit Required",
        text: "Enter a positive number for violation limit.",
        confirmButtonColor: "#800000",
      })
      return
    }

    if (selectedSubjects.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Subject Required",
        text: "Please select at least one subject",
        confirmButtonColor: "#800000",
      })
      return
    }

    const { start, end } = parseTimeSlot(time)

    const payload = {
      batch: activeBatch,
      cie: examType,
      subject: selectedSubjects,
      registerNo: registerState.values,
      date,
      start,
      end,
      topics,
      isRetest,
      isArrear,
      violation: numericViolationLimit,
      regulation,
      academic_year: acadamicYear,
      semester
    }

    if (!isRetest && !isArrear) {
      payload.department = departments
    }

    // 🔄 Show loading
    Swal.fire({
      title: "Scheduling Exam...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      const res = await fetch("/api/main-backend/examiner/exam-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to schedule exam")
      }

      // ✅ Success popup
      await Swal.fire({
        icon: "success",
        title: "Exam Scheduled",
        text: "The exam has been scheduled successfully.",
        confirmButtonColor: "#800000",
      })

      // 🔁 Reset form
      setNormalBatch("")
      setRetestBatch("")
      setArrearBatch("")
      setDepartments("")
      setRegisterState({ mode: "none", values: [] })
      setQaSelected("")
      setOtherSubjects("")
      setDate("")
      setTime("")
      setExamType("")
      setViolationLimit("")
      setRegulation("")
      setAcadamicYear("")
      setSemester("")
      setTopics([])
    } catch (error) {
      console.error("Schedule error:", error)

      Swal.fire({
        icon: "error",
        title: "Scheduling Failed",
        text: error.message || "Something went wrong",
        confirmButtonColor: "#800000",
      })
    }
  }

  return (
    <>
      <Banner
        backgroundImage="./Banners/examsbanner.webp"
        headerText="office of controller of examinations"
        subHeaderText="QA"
      />

      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 mb-4 overflow-x-hidden">
        <div className="mt-4 px-4 mb-2 w-full flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex justify-between items-center w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                <Power size={16} className="text-slate-500" />
                <label className="text-sm font-medium text-slate-700">Retest</label>
                <input
                  type="checkbox"
                  checked={isRetest}
                  onChange={(e) => {
                    setIsRetest(e.target.checked)
                    if (e.target.checked) setIsArrear(false)
                  }}
                  className="h-4 w-4 accent-[#800000] cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                <Power size={16} className="text-slate-500" />
                <label className="text-sm font-medium text-slate-700">Arrear</label>
                <input
                  type="checkbox"
                  checked={isArrear}
                  onChange={(e) => {
                    setIsArrear(e.target.checked)
                    if (e.target.checked) setIsRetest(false)
                  }}
                  className="h-4 w-4 accent-[#800000] cursor-pointer"
                />
              </div>
            </div>
            <button
              className="qa-logout-btn md:hidden"
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
          <div className="flex gap-1 grid grid-cols-2 gap-2 md:flex md:gap-1">
            <button
              onClick={() => navigate("/upload", { state: { page: "student" } })}
              className="
              inline-flex items-center gap-2
              px-4 py-2
              rounded-lg
              border border-[#800000]/30
              bg-white
              text-[#800000]
              text-sm font-medium
              shadow-sm
              hover:bg-[#800000]
              hover:text-white
              hover:border-[#800000]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#800000]/30
            "
            >
              Upload Student Data
              <span className="text-base">→</span>
            </button>
            <button
              onClick={() => navigate("/upload", { state: { page: "question" } })}
              className="
              inline-flex items-center gap-2
              px-4 py-2
              rounded-lg
              border border-[#800000]/30
              bg-white
              text-[#800000]
              text-sm font-medium
              shadow-sm
              hover:bg-[#800000]
              hover:text-prim
              hover:border-[#800000]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#800000]/30
            "
            >
              Upload Questions
              <span className="text-base">→</span>
            </button>
            <button
              onClick={() => navigate("/qaresult")}
              className="
              inline-flex items-center gap-2
              px-4 py-2
              rounded-lg
              border border-[#800000]/30
              bg-white
              text-[#800000]
              text-sm font-medium
              shadow-sm
              hover:bg-[#800000]
              hover:text-prim
              hover:border-[#800000]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#800000]/30
            "
            >
              Download Student Result
              <span className="text-base">→</span>
            </button>
            <button
              onClick={() => navigate("/scheduled-exam")}
              className="
              inline-flex items-center gap-2
              px-4 py-2
              rounded-lg
              border border-[#800000]/30
              bg-white
              text-[#800000]
              text-sm font-medium
              shadow-sm
              hover:bg-[#800000]
              hover:text-prim
              hover:border-[#800000]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#800000]/30
            "
            >
              View Scheduled Exams
              <span className="text-base">→</span>
            </button>
          </div>
          <button
            className="qa-logout-btn !hidden md:!flex"
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
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-brwn text-center flex-1">
              CIE Schedule {`For ${heading} Candidates`} </h2>
          </div>

          <SearchableInput
            key={`batch-${resetKey}`}
            label="Batch"
            icon={GraduationCap}
            options={years}
            value={activeBatch}
            onChange={isRetest ? setRetestBatch : isArrear ? setArrearBatch : setNormalBatch}
            placeholder="Select Batch"
          />

          <SearchableInput
            key={`dept-${resetKey}`}
            label="Department"
            icon={Building2}
            options={departmentOptions}
            value={departments}
            onChange={setDepartments}
            placeholder="Select department(s)"
          />

          <div ref={regRef} className="space-y-2 relative">
            {/* Input box (same style as others) */}
            {isRetest || isArrear ? (
              <MultiSearchDropdown
                key={`batch-${resetKey}`}
                label="Register Numbers"
                icon={Hash}
                options={studentRegs.filter(reg => !registerState.values.includes(reg))}
                value={registerState.values}
                onChange={(vals) =>
                  setRegisterState({ mode: "partial", values: vals })
                }
                placeholder="Search register number"
                multiple
              />
            ) : (
              <>
                <label className="text-slate-700 font-medium text-sm">Register Numbers</label>
                <div
                  className="relative border border-slate-300 rounded-md min-h-[48px]
                  flex items-center gap-2 px-3 cursor-pointer
                  focus-within:ring-2 focus-within:ring-[#fdcc03]/20"
                  onClick={() => setRegDropdownOpen((v) => !v)}
                >
                  <Hash className="w-4 h-4 text-slate-400" />

                  {registerState.mode === "all" ? (
                    <span className="bg-[#fdcc03]/20 px-2 py-1 rounded text-xs">
                      All students selected ({registerState.values.length})
                    </span>
                  ) : registerState.values.length > 0 ? (
                    <span className="bg-[#fdcc03]/20 px-2 py-1 rounded text-xs">
                      {registerState.values.length} students selected
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">
                      Select register numbers
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRegisterState({ mode: "all", values: filteredRegs })
                  setRegDropdownOpen(false)
                }}
                className="text-[#800000] font-medium"
              >
                Select all students
              </button>

              {registerState.mode !== "none" && (
                <button
                  type="button"
                  onClick={() =>
                    setRegisterState({ mode: "none", values: [] })
                  }
                  className="text-slate-500"
                >
                  Clear
                </button>
              )}
            </div>

            {/* DROPDOWN — INSIDE REF */}
            {regDropdownOpen && (
              <div
                className="absolute z-20 w-full bg-white border rounded-md
              shadow-md max-h-60 overflow-auto"
              >
                {loadingRegs ? (
                  <div className="px-3 py-2 text-sm text-slate-400">
                    Loading students...
                  </div>
                ) : filteredRegs.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-400">
                    No students found
                  </div>
                ) : (
                  filteredRegs.map((reg) => {
                    const selected = registerState.values.includes(reg)

                    return (
                      <div
                        key={reg}
                        onClick={() => {
                          setRegisterState((prev) => ({
                            mode: "partial",
                            values: selected
                              ? prev.values.filter((r) => r !== reg)
                              : [...prev.values, reg],
                          }))
                        }}
                        className={`px-3 py-2 cursor-pointer text-sm
                          ${selected
                            ? "bg-[#fdcc03]/20 font-medium"
                            : "hover:bg-slate-100"
                          }`}
                      >
                        {reg}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Dropdown
              label="Regulation"
              placeholder={"Select Regulation"}
              icon={ListOrdered}
              value={regulation}
              values={regulations}
              onChange={setRegulation}
            />

            <Dropdown
              label="Academic Year"
              placeholder={"Select Academic Year"}
              icon={CalendarRange}
              value={acadamicYear}
              values={acadamicYears}
              onChange={setAcadamicYear}
            />

            <Dropdown
              label="Semester"
              placeholder={"Select Semester"}
              icon={BookCheck}
              value={semester}
              values={semesters}
              onChange={setSemester}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SearchableInput
              key={`qa-${resetKey}-${activeBatch}`}
              label="QA Subject"
              icon={BookOpen}
              options={qaSubject ? [qaSubject] : []} // QA subject from current batch
              value={qaSelected}
              onChange={setQaSelected}
              placeholder="Select QA"
            />

            <SearchableInput
              key={`other-${resetKey}-${activeBatch}`}
              label="English Subject"
              icon={BookOpen}
              options={remainingSubjects}
              value={otherSubjects}
              onChange={setOtherSubjects}
              placeholder="Select English subject"
            />
          </div>

          <div>
            {selectedSubjects.map((sub) => (
              <SearchableInput
                key={sub}
                label={`Topics - ${sub}`}
                icon={BookOpen}
                options={getTopicsForSubject(sub)}
                value={topics[sub] || []}
                onChange={(selected) =>
                  setTopics(prev => ({
                    ...prev,
                    [sub]: selected
                  }))
                }
                multiple
                placeholder={`Select ${sub} Topic(s)`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Date"
              icon={Calendar}
              type="date"
              value={date}
              onChange={setDate}
            />

            <Dropdown
              label="Name Of The Examination"
              icon={ListChecks}
              value={examType}
              onChange={setExamType}
              placeholder={"Select Exam Name"}
            />

            <Dropdown
              label="Exam Time"
              placeholder={"Select Exam Time"}
              icon={Clock}
              value={time}
              onChange={setTime}
              type={{
                examType,
                subjectCount: selectedSubjects.length
              }}
            />
          </div>
        
          <Input
            label="Violation Limit"
            icon={ListChecks}
            type="number"
            value={violationLimit}
            onChange={setViolationLimit}
          />

          <button
            onClick={submitExamSchedule}
            type="button"
            className="w-full h-12 bg-[#fdcc03] hover:bg-[#800000]
          text-text hover:text-prim font-medium rounded-md transition"
          >
            Submit CIE Details
          </button>
        </div>
      </div>
    </>
  )
}

function Input({ label, icon: Icon, type, value, onChange, placeholder = "" }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 h-12 w-full border border-slate-300 rounded-md
          focus:ring-2 focus:ring-[#fdcc03]/20"
        />
      </div>
    </div>
  )
}

export default Schedule;