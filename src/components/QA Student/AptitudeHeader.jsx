import { useState, useEffect } from 'react';
import logo from '../../assets/NEWLOGO.png';
import { User } from 'lucide-react';
import { useLocation } from "react-router-dom"

const AptitudeHeader = ({ detailsFlag }) => {
  const [student, setStudent] = useState({});
  const location = useLocation();

  useEffect(() => {
    // Read student details from sessionStorage
    const studentData = sessionStorage.getItem('studentDetails');
    if (studentData) {
      try {
        setStudent(JSON.parse(studentData));
      } catch (error) {
        console.error('Error parsing student details:', error);
      }
    }
  }, [location]);

  return (
    <>
      <nav className="fixed z-[100] w-full">
        <div
          className={
            "flex items-center font-popp group bg-white text-slate-200 transition-all ease-in-out duration-300 w-full h-auto h-20"
          }
        >
          <div className="flex flex-col items-center justify-center select-none ml-4">
            <div className="z-10">
              <img
                src={logo}
                alt="VEC Logo"
                className="w-[2.5rem] md:w-[3.5rem] h-auto object-contain transition-all duration-300 ease-in-out"
              />
            </div>
            <div className="text-center leading-tight mt-1 md:mt-1.5">
              <span className="font-rome text-[0.75rem] md:text-[1.2rem] text-[#4B1E1E] font-thin block">
                VELAMMAL
              </span>
              <span className="font-rome text-[0.45rem] md:text-[0.8rem] text-gray-800 block tracking-wide">
                ENGINEERING COLLEGE
              </span>
              <span className="font-rome text-[0.35rem] md:text-[0.65rem] text-gray-500 italic block">
                The Wheel of Knowledge rolls on!
              </span>
              <span className="font-rome text-[0.35rem] md:text-[0.65rem] text-gray-500 italic block">
                (An Autonomous Institution)
              </span>
            </div>
          </div>

          {/* Title */}
         <div className="flex-grow text-center mr-0 md:mr-[180px]">
            <h1 className="text-[1.7vmax] font-semibold text-amber-800 w-[80%] mx-auto">
              Aptitude Examination Portal
            </h1>
          </div>

          {/* Student Details */}
          {detailsFlag && (
            <div className="flex items-center gap-3 mr-6 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-lg border border-amber-200 shadow-sm">
              <div className="bg-amber-600 p-2 rounded-full">
                <User size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">{student?.name}</p>
                <p className="text-xs text-gray-600">{student?.registerno}</p>
                <p className="text-xs text-gray-500">{student?.department} - {student?.batch}</p>
              </div>
            </div>
          )}
        
        </div>
        <div className='hidden lg:flex px-4 pb-1.5 font-popp bg-secd text-text z-10 w-full h-[0.75rem] rounded-b-lg transition-all'></div>
      </nav>
    </>
  );
};

export default AptitudeHeader;
