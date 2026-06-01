import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import './index.css';

export default function App() {

      const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
      const [consultationModalOpen, setConsultationModalOpen] = useState(false);
      const [activeCurriculumTab, setActiveCurriculumTab] = useState('middle');
      const [selectedCurriculumDetail, setSelectedCurriculumDetail] = useState(null);
      const [formSubmitted, setFormSubmitted] = useState(false);
      
      const [isAdmin, setIsAdmin] = useState(false);
      const [notices, setNotices] = useState([]);
      const [loginModalOpen, setLoginModalOpen] = useState(false);
      const [noticeWriteModalOpen, setNoticeWriteModalOpen] = useState(false);
      const [selectedNotice, setSelectedNotice] = useState(null);
      const [editingNoticeId, setEditingNoticeId] = useState(null);
      const [loginForm, setLoginForm] = useState({ id: '', password: '' });
      const [noticeForm, setNoticeForm] = useState({ title: '', content: '', file: null, fileName: '' });

      const defaultTimetableCols = [
        { id: 'time', name: '시간', isTime: true },
        { id: 'mon', name: '월요일', isTime: false },
        { id: 'tue', name: '화요일', isTime: false },
        { id: 'wed', name: '수요일', isTime: false },
        { id: 'thu', name: '목요일', isTime: false },
        { id: 'fri', name: '금요일', isTime: false },
        { id: 'sat', name: '토요일', isTime: false }
      ];
      const defaultTimetableRows = [
        { id: 'row_1', values: { time: '14:00 - 15:30', mon: '초등 기초 강화반', tue: '-', wed: '초등 기초 강화반', thu: '-', fri: '초등 기초 강화반', sat: '-' } },
        { id: 'row_2', values: { time: '15:30 - 17:30', mon: '-', tue: '초등 심화/경시반', wed: '-', thu: '초등 심화/경시반', fri: '-', sat: '초등 심화 (10:00-12:00)' } },
        { id: 'row_3', values: { time: '17:30 - 19:30', mon: '중등 내신 만점반', tue: '중등 내신 만점반', wed: '중등 내신 만점반', thu: '중등 내신 만점반', fri: '중등 내신 만점반', sat: '중등 내신 (13:00-15:00)' } },
        { id: 'row_4', values: { time: '19:30 - 22:00', mon: '-', tue: '고등 대비 속진반', wed: '-', thu: '고등 대비 속진반', fri: '-', sat: '고등 대비 (15:00-17:30)' } }
      ];
      const [timetableCols, setTimetableCols] = useState(defaultTimetableCols);
      const [timetableRows, setTimetableRows] = useState(defaultTimetableRows);
      const [timetableEditMode, setTimetableEditMode] = useState(false);

      const defaultCurriculum = {
        elementary: {
          title: "초등부 과정 (초등 4~6학년)",
          subtitle: "사고력 계발과 수학적 기초 원리 개념 확립 단계",
          features: ["기하/대수 교구 활용 개념 모델링", "서술형 문항 풀이 정밀 구조화 훈련", "주 1회 수학적 직관 향상 오답 세션"],
          courses: [
            {
              id: 'elem_1',
              name: "초등 기초 강화반",
              desc: "교과 진도 중심의 정밀 학습 및 계산 능력(연산력) 극대화",
              schedule: "월/수/금 (주 3회, 일 90분)",
              details: "초등 수학의 핵심 연산 및 단원별 기초 다지기 과정으로 오답률을 5% 미만으로 체계적으로 제어합니다."
            },
            {
              id: 'elem_2',
              name: "초등 심화/경시반",
              desc: "최상위 수학 심화 해결 및 창의 사고력 증진 과정",
              schedule: "화/목 (주 2회, 일 120분)",
              details: "3% 이내 최상위권 학생 대상. 올림피아드 및 경시대회 기출 문제 풀이 중심의 깊이 있는 수업을 제공합니다."
            }
          ]
        },
        middle: {
          title: "중등부 과정 (중등 1~3학년)",
          subtitle: "완벽한 내신 만점과 고교 진학 수학의 강력한 논리적 주춧돌 형성",
          features: ["학기별 3단계 고난도 심화 워크북", "오답 유사문항 정밀 매칭 시스템", "매일 실전 기출 모의고사 15분"],
          courses: [
            {
              id: 'mid_1',
              name: "중등 내신 만점반",
              desc: "단원별 핵심 개념 정리와 학교 기출 완벽 분석 및 고난도 킬러 문제 대비",
              schedule: "월/수/금 또는 화/목/토 (주 3회, 일 120분)",
              details: "내신 만점을 목표로 각 학교별 기출 킬러 분석 문항과 주간 단위 서술형 밀착 첨삭 피드백이 제공됩니다."
            },
            {
              id: 'mid_2',
              name: "고등 대비 속진반",
              desc: "중등 심화 과정 완성 및 고등 공통수학1, 2 개념 심화 선행 학습",
              schedule: "화/목/토 (주 3회, 일 150분)",
              details: "수학적 이해력이 우수한 학생을 대상으로 하며, 단순 진도 빼기가 아닌 고등 수학의 깊은 개념적 연결을 완성합니다."
            }
          ]
        }
      };

      const [curriculumData, setCurriculumData] = useState(defaultCurriculum);
      const [curriculumEditMode, setCurriculumEditMode] = useState(false);

      const [currentMonth, setCurrentMonth] = useState(new Date());
      const [monthlyCalendar, setMonthlyCalendar] = useState({}); // { '2026-06-15': 'class' | 'holiday' | undefined }
      const [calendarEditMode, setCalendarEditMode] = useState(false);
      useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          setIsAdmin(!!user);
        });
        return () => unsubscribeAuth();
      }, []);

      useEffect(() => {
        const fetchData = async () => {
          try {
            // Load Notices
            const noticesSnap = await getDocs(collection(db, 'notices'));
            if (!noticesSnap.empty) {
              const fetchedNotices = noticesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              fetchedNotices.sort((a, b) => new Date(b.date) - new Date(a.date));
              setNotices(fetchedNotices);
            } else {
              setNotices([
                { id: 'default1', title: 'APEX 수학학원 홈페이지가 오픈되었습니다.', content: '환영합니다.', date: '2026-05-25', file: null, fileName: '' }
              ]);
            }

            // Load Timetable
            const timetableSnap = await getDocs(collection(db, 'timetable'));
            timetableSnap.forEach(doc => {
              if (doc.id === 'cols') setTimetableCols(doc.data().data);
              if (doc.id === 'rows') setTimetableRows(doc.data().data);
            });

            // Load Curriculum
            const curriculumSnap = await getDocs(collection(db, 'curriculum'));
            if (!curriculumSnap.empty) {
              const curData = {};
              curriculumSnap.forEach(doc => curData[doc.id] = doc.data());
              if (curData.elementary && curData.middle) {
                setCurriculumData(curData);
              }
            }

            // Load Calendar
            const calendarSnap = await getDocs(collection(db, 'calendar'));
            calendarSnap.forEach(doc => {
              if (doc.id === 'monthly') setMonthlyCalendar(doc.data().data || {});
            });
          } catch (e) {
            console.error('Error fetching initial data from Firestore:', e);
          }
        };
        fetchData();
      }, []);

      useEffect(() => {
        const fetchConsultations = async () => {
          if (!isAdmin) return;
          try {
            const consultSnap = await getDocs(collection(db, 'consultations'));
            if (!consultSnap.empty) {
              const reqs = consultSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              // Sort newest first based on parseable date if possible
              reqs.reverse();
              setConsultationRequests(reqs);
            } else {
              setConsultationRequests([]);
            }
          } catch (e) {
            console.error('Error fetching consultations:', e);
          }
        };
        fetchConsultations();
      }, [isAdmin]);

      const [formData, setFormData] = useState({
        studentName: '',
        parentName: '',
        phoneNumber: '',
        grade: 'middle1',
        message: ''
      });

      const [consultationRequests, setConsultationRequests] = useState([]);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [toast, setToast] = useState({ show: false, message: '' });

      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };

      const showToastMessage = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 4000);
      };

      const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.studentName || !formData.parentName || !formData.phoneNumber) {
          showToastMessage('필수 항목을 모두 입력해주세요.');
          return;
        }
        setIsSubmitting(true);
        
        try {
          const newRequest = {
            date: new Date().toLocaleString(),
            ...formData
          };
          const docRef = await addDoc(collection(db, 'consultations'), newRequest);
          const updatedRequests = [{ id: docRef.id, ...newRequest }, ...consultationRequests];
          setConsultationRequests(updatedRequests);

          setIsSubmitting(false);
          setFormSubmitted(true);
          showToastMessage('상담 신청이 성공적으로 접수되었습니다!');
        } catch(e) {
          console.error(e);
          setIsSubmitting(false);
          showToastMessage('오류가 발생했습니다.');
        }
      };

      const handleDeleteConsultation = async (id) => {
        if (window.confirm('이 신청 내역을 삭제하시겠습니까?')) {
          try {
            await deleteDoc(doc(db, 'consultations', id));
            const updatedRequests = consultationRequests.filter(req => req.id !== id);
            setConsultationRequests(updatedRequests);
            showToastMessage('신청 내역이 삭제되었습니다.');
          } catch(e) {
            console.error(e);
            showToastMessage('오류가 발생했습니다.');
          }
        }
      };

      const resetForm = () => {
        setFormData({
          studentName: '',
          parentName: '',
          phoneNumber: '',
          grade: 'middle1',
          message: ''
        });
        setFormSubmitted(false);
      };

      // Close modal on escape key
      useEffect(() => {
        const handleKeyDown = (e) => {
          if (e.key === 'Escape') {
            setConsultationModalOpen(false);
            setSelectedCurriculumDetail(null);
            setLoginModalOpen(false);
            setNoticeWriteModalOpen(false);
            setSelectedNotice(null);
            setEditingNoticeId(null);
            setNoticeForm({ title: '', content: '', file: null, fileName: '' });
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, []);

      const handleLogin = async (e) => {
        e.preventDefault();
        try {
          await signInWithEmailAndPassword(auth, loginForm.id, loginForm.password);
          setLoginModalOpen(false);
          setLoginForm({ id: '', password: '' });
          showToastMessage('관리자로 로그인되었습니다.');
        } catch (error) {
          showToastMessage('아이디 또는 비밀번호가 일치하지 않습니다.');
        }
      };

      const handleNoticeFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            showToastMessage('파일 크기는 2MB 이하여야 합니다.');
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            setNoticeForm(prev => ({ ...prev, file: event.target.result, fileName: file.name }));
          };
          reader.readAsDataURL(file);
        }
      };

      const handleNoticeSubmit = async (e) => {
        e.preventDefault();
        if (!noticeForm.title || !noticeForm.content) {
          showToastMessage('제목과 내용을 모두 입력해주세요.');
          return;
        }
        
        try {
          if (editingNoticeId) {
            await updateDoc(doc(db, 'notices', editingNoticeId), {
              title: noticeForm.title,
              content: noticeForm.content,
              file: noticeForm.file,
              fileName: noticeForm.fileName
            });
            const updatedNotices = notices.map(notice => 
              notice.id === editingNoticeId 
                ? { ...notice, title: noticeForm.title, content: noticeForm.content, file: noticeForm.file, fileName: noticeForm.fileName }
                : notice
            );
            setNotices(updatedNotices);
            showToastMessage('공지사항이 수정되었습니다.');
          } else {
            const newNotice = {
              title: noticeForm.title,
              content: noticeForm.content,
              file: noticeForm.file,
              fileName: noticeForm.fileName,
              date: new Date().toISOString().split('T')[0]
            };
            const docRef = await addDoc(collection(db, 'notices'), newNotice);
            setNotices([{ id: docRef.id, ...newNotice }, ...notices]);
            showToastMessage('공지사항이 등록되었습니다.');
          }
          setNoticeWriteModalOpen(false);
          setEditingNoticeId(null);
          setNoticeForm({ title: '', content: '', file: null, fileName: '' });
        } catch(err) {
          console.error(err);
          showToastMessage('오류가 발생했습니다.');
        }
      };

      const handleNoticeDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
          try {
            await deleteDoc(doc(db, 'notices', id));
            setNotices(notices.filter(n => n.id !== id));
            showToastMessage('공지사항이 삭제되었습니다.');
            if (selectedNotice?.id === id) setSelectedNotice(null);
          } catch(err) {
            console.error(err);
            showToastMessage('오류가 발생했습니다.');
          }
        }
      };

      const handleNoticeEdit = (e, notice) => {
        e.stopPropagation();
        setEditingNoticeId(notice.id);
        setNoticeForm({
          title: notice.title,
          content: notice.content,
          file: notice.file,
          fileName: notice.fileName
        });
        setNoticeWriteModalOpen(true);
      };

      const handleTimetableCellChange = (rowIndex, colId, value) => {
        const newRows = [...timetableRows];
        if (!newRows[rowIndex].values) newRows[rowIndex].values = {};
        newRows[rowIndex].values[colId] = value;
        setTimetableRows(newRows);
      };

      const handleTimetableColNameChange = (colIndex, newName) => {
        const newCols = [...timetableCols];
        newCols[colIndex].name = newName;
        setTimetableCols(newCols);
      };

      const handleAddTimetableRow = () => {
        const newRowId = 'row_' + Date.now();
        setTimetableRows([...timetableRows, { id: newRowId, values: {} }]);
      };

      const handleRemoveTimetableRow = (rowIndex) => {
        const newRows = timetableRows.filter((_, idx) => idx !== rowIndex);
        setTimetableRows(newRows);
      };

      const handleAddTimetableCol = () => {
        const newColId = 'col_' + Date.now();
        setTimetableCols([...timetableCols, { id: newColId, name: '새 요일', isTime: false }]);
      };

      const handleRemoveTimetableCol = (colId) => {
        const newCols = timetableCols.filter(col => col.id !== colId);
        setTimetableCols(newCols);
      };

      const handleTimetableSave = async () => {
        try {
          await setDoc(doc(db, 'timetable', 'cols'), { data: timetableCols });
          await setDoc(doc(db, 'timetable', 'rows'), { data: timetableRows });
          setTimetableEditMode(false);
          showToastMessage('시간표 행/열 구조와 데이터가 저장되었습니다.');
        } catch(err) {
          showToastMessage('오류가 발생했습니다.');
        }
      };

      const handleCurriculumSave = async () => {
        try {
          await setDoc(doc(db, 'curriculum', 'elementary'), curriculumData.elementary);
          await setDoc(doc(db, 'curriculum', 'middle'), curriculumData.middle);
          setCurriculumEditMode(false);
          showToastMessage('커리큘럼 데이터가 저장되었습니다.');
        } catch(err) {
          showToastMessage('오류가 발생했습니다.');
        }
      };

      const handleCurriculumChange = (tab, field, value) => {
        setCurriculumData(prev => ({
          ...prev,
          [tab]: { ...prev[tab], [field]: value }
        }));
      };

      const handleCurriculumFeatureChange = (tab, idx, value) => {
        setCurriculumData(prev => {
          const newFeatures = [...prev[tab].features];
          newFeatures[idx] = value;
          return {
            ...prev,
            [tab]: { ...prev[tab], features: newFeatures }
          };
        });
      };

      const handleCurriculumCourseChange = (tab, idx, field, value) => {
        setCurriculumData(prev => {
          const newCourses = [...prev[tab].courses];
          newCourses[idx] = { ...newCourses[idx], [field]: value };
          return {
            ...prev,
            [tab]: { ...prev[tab], courses: newCourses }
          };
        });
      };

      // Calendar Handlers
      const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      };
      
      const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      };

      const handleCalendarDayClick = (dateString) => {
        if (!calendarEditMode) return;
        setMonthlyCalendar(prev => {
          const currentState = prev[dateString];
          let nextState = 'class'; // default class
          if (currentState === 'class') nextState = 'holiday';
          else if (currentState === 'holiday') nextState = null;
          
          const newState = { ...prev };
          if (nextState) {
            newState[dateString] = nextState;
          } else {
            delete newState[dateString];
          }
          return newState;
        });
      };

      const handleCalendarSave = async () => {
        try {
          await setDoc(doc(db, 'calendar', 'monthly'), { data: monthlyCalendar });
          setCalendarEditMode(false);
          showToastMessage('월간 시간표 일정이 저장되었습니다.');
        } catch(err) {
          showToastMessage('오류가 발생했습니다.');
        }
      };

      const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
      };
      const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
      };

      const currentYear = currentMonth.getFullYear();
      const currentMonthIndex = currentMonth.getMonth();
      const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex);
      const firstDay = getFirstDayOfMonth(currentYear, currentMonthIndex);
      
      const calendarDays = [];
      for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(currentYear, currentMonthIndex, i);
        const dateString = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        calendarDays.push({ day: i, dateString });
      }

      return (
        <div className="relative min-h-screen flex flex-col bg-zinc-50 text-zinc-900 selection:bg-amber-100 selection:text-amber-900">
          {/* Toast Notification */}
          {toast.show && (
            <div className="fixed top-24 right-6 z-50 transform translate-y-0 transition-all duration-300">
              <div className="bg-zinc-900 text-white font-bold px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border border-zinc-700">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                <span className="text-sm">{toast.message}</span>
              </div>
            </div>
          )}

          {/* Header Section */}
          <header className="sticky top-0 z-40 w-full glassmorphism transition-all">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              {/* Logo */}
              <a href="#" className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-xl border border-zinc-700 shadow-lg">
                  Σ
                </div>
                <span className="font-display font-extrabold text-2xl tracking-wider text-zinc-955">
                  APEX <span className="text-amber-600 font-sans font-bold text-lg ml-0.5">MATH</span>
                </span>
              </a>

              {/* Navigation Desktop */}
              <nav className="hidden md:flex items-center space-x-9">
                <a href="#notice" className="text-zinc-650 hover:text-zinc-955 font-extrabold text-sm transition-colors">공지사항</a>
                <a href="#features" className="text-zinc-650 hover:text-zinc-955 font-extrabold text-sm transition-colors">학원 강점</a>
                <a href="#curriculum" className="text-zinc-650 hover:text-zinc-955 font-extrabold text-sm transition-colors">커리큘럼</a>
                <a href="#timetable" className="text-zinc-650 hover:text-zinc-955 font-extrabold text-sm transition-colors">주간 시간표</a>
                <a href="#teachers" className="text-zinc-650 hover:text-zinc-955 font-extrabold text-sm transition-colors">원장 소개</a>
                <a href="#testimonials" className="text-zinc-650 hover:text-zinc-955 font-extrabold text-sm transition-colors">성공 후기</a>
                <a href="#consultation" className="text-zinc-650 hover:text-zinc-955 font-extrabold text-sm transition-colors">오시는 길</a>
              </nav>

              {/* Header Right CTA */}
              <div className="hidden md:flex items-center space-x-4">
                {isAdmin ? (
                  <button onClick={() => { setIsAdmin(false); sessionStorage.removeItem('isAdmin'); showToastMessage('로그아웃 되었습니다.'); }} className="text-xs font-bold text-zinc-500 hover:text-zinc-800">
                    관리자 로그아웃
                  </button>
                ) : (
                  <button onClick={() => setLoginModalOpen(true)} className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    관리자 로그인
                  </button>
                )}
                <a 
                  href="#consultation"
                  className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-extrabold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md text-xs border border-amber-700"
                >
                  상담 신청하기
                </a>
              </div>

              {/* Hamburger Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-zinc-800 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="md:hidden bg-white border-b border-zinc-200 py-6 px-6 space-y-4 absolute top-20 left-0 w-full shadow-2xl">
                <a 
                  href="#notice" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-zinc-800 hover:text-amber-600 font-bold py-2 text-base border-b border-zinc-100"
                >
                  공지사항
                </a>
                <a 
                  href="#features" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-zinc-800 hover:text-amber-600 font-bold py-2 text-base border-b border-zinc-100"
                >
                  학원 강점
                </a>
                <a 
                  href="#curriculum" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-zinc-800 hover:text-amber-600 font-bold py-2 text-base border-b border-zinc-100"
                >
                  커리큘럼
                </a>
                <a 
                  href="#timetable" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-zinc-800 hover:text-amber-600 font-bold py-2 text-base border-b border-zinc-100"
                >
                  주간 시간표
                </a>
                <a 
                  href="#teachers" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-zinc-800 hover:text-amber-600 font-bold py-2 text-base border-b border-zinc-100"
                >
                  원장 소개
                </a>
                <a 
                  href="#testimonials" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-zinc-800 hover:text-amber-600 font-bold py-2 text-base border-b border-zinc-100"
                >
                  성공 후기
                </a>
                <a 
                  href="#consultation" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-zinc-800 hover:text-amber-600 font-bold py-2 text-base"
                >
                  상담 신청 & 오시는 길
                </a>
                <div className="pt-4 border-t border-zinc-100">
                  <a 
                    href="#consultation"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block bg-amber-600 text-zinc-955 text-center font-extrabold py-3 rounded-xl text-sm border border-amber-700"
                  >
                    상담 신청하기
                  </a>
                </div>
                <div className="pt-4 text-center">
                  {isAdmin ? (
                    <button onClick={() => { setIsAdmin(false); sessionStorage.removeItem('isAdmin'); setMobileMenuOpen(false); showToastMessage('로그아웃 되었습니다.'); }} className="text-xs font-bold text-zinc-500 hover:text-zinc-800">
                      관리자 로그아웃
                    </button>
                  ) : (
                    <button onClick={() => { setLoginModalOpen(true); setMobileMenuOpen(false); }} className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center justify-center w-full">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      관리자 로그인
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* Hero Section */}
          <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-24 px-6 bg-zinc-950">
            {/* Background Image with overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src="math_hero_bg.png" 
                alt="수학 기하학 무늬 배경" 
                className="w-full h-full object-cover opacity-5"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-955/95 via-zinc-955/90 to-zinc-955"></div>
              {/* Glowing gradients */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"></div>
              <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>
            </div>

            <div className="max-w-4xl mx-auto text-center relative z-10 w-full space-y-8">
              <div className="inline-flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-full px-5 py-2 text-amber-400 font-extrabold text-xs tracking-wider shadow-inner">
                <span>■</span>
                <span>초/중등 전문 수학 - 계양구 효성동 최상위 수리 교육관</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white break-keep">
                생각의 <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">차이</span>가<br className="sm:hidden" /> 수학의 <span className="underline decoration-amber-500 decoration-8 underline-offset-8">등급</span>을 만듭니다.
              </h1>

              <p className="text-lg md:text-xl text-zinc-200 max-w-2xl mx-auto font-bold leading-relaxed break-keep">
                단순 암기식 연산과 주입식 교육은 중학교 심화 과정부터 무너집니다. 
                APEX 수학학원은 철저한 개념 유도와 1:1 오답 클리닉으로 스스로 답을 내는 진짜 해결력을 키웁니다.
              </p>

              {/* Hero CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <a 
                  href="#consultation" 
                  className="glow-amber bg-amber-600 text-zinc-950 font-extrabold px-10 py-5 rounded-2xl text-base shadow-2xl w-full sm:w-auto text-center transition-all duration-300 hover:bg-amber-500"
                >
                  상담 신청하기
                </a>
                <a 
                  href="#curriculum"
                  className="border-2 border-zinc-700 hover:border-amber-400 hover:bg-zinc-900 text-white font-extrabold px-10 py-5 rounded-2xl text-base transition-all duration-300 w-full sm:w-auto text-center"
                >
                  커리큘럼 보기
                </a>
              </div>

              {/* Hero Badges */}
              <div className="grid grid-cols-3 gap-6 pt-12 border-t border-zinc-850 max-w-lg mx-auto">
                <div>
                  <div className="text-amber-400 text-3xl font-black font-display">A등급 68%</div>
                  <div className="text-zinc-200 text-xs font-bold mt-1.5">내신 우수 등급 도달</div>
                </div>
                <div>
                  <div className="text-amber-400 text-3xl font-black font-display">1:1 밀착</div>
                  <div className="text-zinc-200 text-xs font-bold mt-1.5">개별 오답 매칭 클리닉</div>
                </div>
                <div>
                  <div className="text-amber-400 text-3xl font-black font-display">100% 전송</div>
                  <div className="text-zinc-200 text-xs font-bold mt-1.5">학습 현황 즉시 보고</div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="bg-zinc-900 py-16 px-6 border-y border-zinc-850">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-zinc-300 text-sm font-bold">대표원장 직강</div>
                <div className="text-4xl md:text-5xl font-black text-white font-display">대치동<span className="text-amber-400 text-2xl font-sans font-medium">출신</span></div>
                <div className="text-xs text-zinc-300">오답 실무 분석가 대표원장 직강</div>
              </div>
              <div className="space-y-2 border-l border-zinc-800">
                <div className="text-zinc-300 text-sm font-bold">내신 만점 & A등급 비율</div>
                <div className="text-4xl md:text-5xl font-black text-white font-display">68<span className="text-amber-400 text-2xl font-sans font-medium">%</span></div>
                <div className="text-xs text-zinc-300">효성동/작전동 주요 중학교 재원생 기준</div>
              </div>
              <div className="space-y-2 border-l border-zinc-800">
                <div className="text-zinc-300 text-sm font-bold">누적 수강생 수</div>
                <div className="text-4xl md:text-5xl font-black text-white font-display">1,850<span className="text-amber-400 text-2xl font-sans font-medium">명+</span></div>
                <div className="text-xs text-zinc-300">초/중등 개설 이후 누적 집계</div>
              </div>
              <div className="space-y-2 border-l border-zinc-800">
                <div className="text-zinc-300 text-sm font-bold">오답 분석 클리닉</div>
                <div className="text-4xl md:text-5xl font-black text-white font-display">32만<span className="text-amber-400 text-2xl font-sans font-medium">건+</span></div>
                <div className="text-xs text-zinc-300">자체 오답 분석 데이터 DB</div>
              </div>
            </div>
          </section>

          {/* Notice Section */}
          <section id="notice" className="py-24 px-6 max-w-7xl mx-auto border-b border-zinc-200">
            <div className="flex justify-between items-end mb-12">
              <div className="space-y-4">
                <span className="text-amber-700 font-extrabold text-xs uppercase tracking-widest bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full">NOTICE</span>
                <h2 className="text-3xl md:text-4xl font-black text-zinc-950">공지사항</h2>
              </div>
              {isAdmin && (
                <button onClick={() => setNoticeWriteModalOpen(true)} className="bg-zinc-900 hover:bg-amber-600 text-white font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md border border-zinc-700 text-sm">
                  + 글쓰기
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {notices.map(notice => (
                <div key={notice.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-amber-400 transition-colors shadow-sm">
                  <div 
                    onClick={() => setSelectedNotice(selectedNotice?.id === notice.id ? null : notice)}
                    className="p-6 cursor-pointer flex justify-between items-center bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-xs font-bold text-zinc-500 bg-white border border-zinc-200 px-3 py-1 rounded-lg">{notice.date}</span>
                      <h3 className="text-lg font-bold text-zinc-900">{notice.title}</h3>
                      {notice.file && (
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                      )}
                    </div>
                    <div>
                      <svg className={`w-5 h-5 text-zinc-400 transition-transform ${selectedNotice?.id === notice.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  
                  {selectedNotice?.id === notice.id && (
                    <div className="p-6 border-t border-zinc-100 bg-white">
                      <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed text-sm font-bold">{notice.content}</p>
                      
                      {notice.file && (
                        <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center space-x-3">
                          <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-zinc-500 mb-0.5">첨부파일</p>
                            <a href={notice.file} download={notice.fileName} className="text-sm font-extrabold text-amber-700 hover:text-amber-600 hover:underline">
                              {notice.fileName}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {isAdmin && (
                        <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-end space-x-3">
                          <button 
                            onClick={(e) => handleNoticeEdit(e, notice)}
                            className="px-4 py-2 text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-200"
                          >
                            수정
                          </button>
                          <button 
                            onClick={(e) => handleNoticeDelete(e, notice.id)}
                            className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {notices.length === 0 && (
                <div className="text-center py-12 text-zinc-500 font-bold border border-zinc-200 rounded-2xl bg-zinc-50">
                  등록된 공지사항이 없습니다.
                </div>
              )}
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <span className="text-amber-700 font-extrabold text-xs uppercase tracking-widest bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full">WHY APEX</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-950 leading-tight">
                초/중등 수학 만점을 완성하는 3대 핵심 체계
              </h2>
              <p className="text-zinc-800 max-w-xl mx-auto font-bold text-sm md:text-base leading-relaxed">
                단순히 문제를 기계적으로 푸는 방식을 지양합니다. 스스로 문제를 설계하는 주체적 사고력을 학습합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 group shadow-sm hover:shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform border border-amber-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">개념 원리 유도 백지 테스트</h3>
                <p className="text-zinc-700 font-bold leading-relaxed text-sm">
                  공식을 외우기 전, 백지에 공식의 개념적 탄생 배경과 원리를 유도하는 과정을 직접 정리하여 수학적 논리의 단단한 기둥을 쌓아 나갑니다.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 group shadow-sm hover:shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900/10 flex items-center justify-center text-zinc-900 mb-6 group-hover:scale-110 transition-transform border border-zinc-350">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">1:1 개인 오답 쌍둥이 노트</h3>
                <p className="text-zinc-700 font-bold leading-relaxed text-sm">
                  틀린 문항뿐만 아니라 그와 쌍둥이처럼 유기적으로 엮인 고난도 유사 변형 문항을 개인별로 실시간 생성하여 완벽히 정복할 때까지 오답 클리닉을 돌립니다.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 group shadow-sm hover:shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform border border-amber-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">실시간 모바일 학습 레포트</h3>
                <p className="text-zinc-700 font-bold leading-relaxed text-sm">
                  당일 진행된 일일 평가 결과, 숙제 완수도 및 약점 보강 계획을 매 수업 종료 직후 학부모님 스마트폰으로 신속히 전달하여 소통의 투명성을 극대화합니다.
                </p>
              </div>
            </div>
          </section>

          {/* Curriculum Section */}
          <section id="curriculum" className="bg-zinc-100 py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <span className="text-amber-700 font-extrabold text-xs uppercase tracking-widest bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full">CURRICULUM</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-950">초/중등 전과정 수리 로드맵</h2>
                <p className="text-zinc-750 max-w-xl mx-auto font-bold">체계적이고 탄탄한 학생 맞춤형 개념 및 심화 설계를 제공합니다.</p>
              </div>

              {/* Tab Selector */}
              <div className="flex justify-center mb-12">
                <div className="inline-flex p-1.5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                  <button 
                    onClick={() => setActiveCurriculumTab('elementary')}
                    className={`px-8 py-3.5 rounded-xl font-extrabold text-sm transition-all duration-300 ${activeCurriculumTab === 'elementary' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-650 hover:text-zinc-950'}`}
                  >
                    초등부 (4~6학년)
                  </button>
                  <button 
                    onClick={() => setActiveCurriculumTab('middle')}
                    className={`px-8 py-3.5 rounded-xl font-extrabold text-sm transition-all duration-300 ${activeCurriculumTab === 'middle' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-650 hover:text-zinc-950'}`}
                  >
                    중등부 (1~3학년)
                  </button>
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end mb-4">
                  {curriculumEditMode ? (
                    <button onClick={handleCurriculumSave} className="bg-amber-600 text-zinc-950 font-bold px-5 py-2.5 rounded-xl shadow-md border border-amber-700 text-sm">
                      커리큘럼 저장
                    </button>
                  ) : (
                    <button onClick={() => setCurriculumEditMode(true)} className="bg-zinc-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-md border border-zinc-700 text-sm hover:bg-zinc-800">
                      커리큘럼 수정 모드
                    </button>
                  )}
                </div>
              )}

              {/* Tab Content Display */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 lg:p-12 shadow-sm transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  <div className="lg:col-span-5 space-y-6">
                    {curriculumEditMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-zinc-500">타이틀</label>
                          <input type="text" value={curriculumData[activeCurriculumTab].title} onChange={(e) => handleCurriculumChange(activeCurriculumTab, 'title', e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-2 font-bold text-lg" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-500">서브타이틀</label>
                          <input type="text" value={curriculumData[activeCurriculumTab].subtitle} onChange={(e) => handleCurriculumChange(activeCurriculumTab, 'subtitle', e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-2 font-bold text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-500 mb-1 block">특징 (3개)</label>
                          {curriculumData[activeCurriculumTab].features.map((feat, idx) => (
                            <input key={idx} type="text" value={feat} onChange={(e) => handleCurriculumFeatureChange(activeCurriculumTab, idx, e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-1.5 font-bold text-sm mb-2" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <React.Fragment>
                        <h3 className="text-2xl lg:text-3xl font-black text-zinc-950">
                          {curriculumData[activeCurriculumTab].title}
                        </h3>
                        <p className="text-amber-700 font-extrabold text-base">
                          {curriculumData[activeCurriculumTab].subtitle}
                        </p>
                        <div className="space-y-3.5 pt-2">
                          {curriculumData[activeCurriculumTab].features.map((feat, idx) => (
                            <div key={idx} className="flex items-center space-x-3 text-zinc-800 text-sm font-bold">
                              <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </React.Fragment>
                    )}
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {curriculumData[activeCurriculumTab].courses.map((course, idx) => (
                      <div 
                        key={course.id || idx}
                        onClick={() => !curriculumEditMode && setSelectedCurriculumDetail(course)}
                        className={`bg-zinc-50 border p-6 rounded-2xl transition-all duration-300 ${curriculumEditMode ? 'border-zinc-300' : 'border-zinc-200 hover:border-amber-500 cursor-pointer hover:shadow-md hover:-translate-y-1'}`}
                      >
                        {curriculumEditMode ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-bold text-zinc-500">강의명</label>
                              <input type="text" value={course.name} onChange={(e) => handleCurriculumCourseChange(activeCurriculumTab, idx, 'name', e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-1.5 font-bold text-sm" />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-zinc-500">요약 설명</label>
                              <textarea value={course.desc} onChange={(e) => handleCurriculumCourseChange(activeCurriculumTab, idx, 'desc', e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-1.5 font-bold text-sm" rows="2"></textarea>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-zinc-500">시간표</label>
                              <input type="text" value={course.schedule} onChange={(e) => handleCurriculumCourseChange(activeCurriculumTab, idx, 'schedule', e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-1.5 font-bold text-sm" />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-zinc-500">상세 정보(모달용)</label>
                              <textarea value={course.details} onChange={(e) => handleCurriculumCourseChange(activeCurriculumTab, idx, 'details', e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-1.5 font-bold text-sm" rows="3"></textarea>
                            </div>
                          </div>
                        ) : (
                          <React.Fragment>
                            <h4 className="text-lg font-bold text-zinc-900 mb-2 flex items-center justify-between">
                              <span>{course.name}</span>
                              <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-250 font-bold">상세정보</span>
                            </h4>
                            <p className="text-zinc-700 text-xs mb-4 line-clamp-2 leading-relaxed font-semibold">
                              {course.desc}
                            </p>
                            <div className="text-[11px] font-extrabold text-amber-800 flex items-center space-x-1.5">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{course.schedule}</span>
                            </div>
                          </React.Fragment>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Timetable Section */}
          <section id="timetable" className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-200">
            <div className="text-center space-y-4 mb-16">
              <span className="text-amber-700 font-extrabold text-xs uppercase tracking-widest bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full">TIMETABLE</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-950">주간 시간표</h2>
              <p className="text-zinc-800 max-w-xl mx-auto font-bold leading-relaxed">
                현재 운영 중인 반별 주간 시간표입니다. (상세 내용은 학원으로 문의 바랍니다.)
              </p>
            </div>
            
            {isAdmin && (
              <div className="flex justify-end mb-4">
                {timetableEditMode ? (
                  <button onClick={handleTimetableSave} className="bg-amber-600 text-zinc-950 font-bold px-5 py-2.5 rounded-xl shadow-md border border-amber-700 text-sm">
                    수정 완료 및 저장
                  </button>
                ) : (
                  <button onClick={() => setTimetableEditMode(true)} className="bg-zinc-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-md border border-zinc-700 text-sm hover:bg-zinc-800">
                    시간표 수정 모드
                  </button>
                )}
              </div>
            )}

            <div className="overflow-x-auto bg-white border border-zinc-200 rounded-3xl shadow-sm">
              <table className="w-full min-w-[700px] text-sm text-center">
                <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-900 font-black">
                  <tr>
                    {timetableCols.map((col, cIdx) => (
                      <th key={col.id} className={`py-4 px-6 ${cIdx !== 0 ? 'border-l border-zinc-200' : 'border-r border-zinc-200'} relative group`}>
                        {timetableEditMode && !col.isTime ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={col.name}
                              onChange={(e) => handleTimetableColNameChange(cIdx, e.target.value)}
                              className="w-full text-center border border-zinc-300 rounded px-2 py-1 text-xs"
                            />
                            <button onClick={() => handleRemoveTimetableCol(col.id)} className="text-red-500 hover:text-red-700 p-1 bg-white rounded-full shadow-sm" title="열 삭제">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          </div>
                        ) : col.name}
                      </th>
                    ))}
                    {timetableEditMode && (
                      <th className="py-4 px-4 border-l border-zinc-200 w-24">
                        <button onClick={handleAddTimetableCol} className="text-xs bg-white border border-zinc-200 text-zinc-600 font-bold px-3 py-1.5 rounded-lg hover:bg-zinc-50 w-full">+ 열 추가</button>
                      </th>
                    )}
                    {timetableEditMode && <th className="w-20"></th>} {/* For Row delete button column */}
                  </tr>
                </thead>
                <tbody className="text-zinc-800 font-bold divide-y divide-zinc-100">
                  {timetableRows.map((row, rIdx) => (
                    <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                      {timetableCols.map((col, cIdx) => (
                        <td key={col.id} className={`py-4 px-6 ${cIdx === 0 ? 'font-black text-zinc-950 bg-zinc-50 border-r border-zinc-200' : 'border-l border-zinc-100'}`}>
                          {timetableEditMode ? (
                            <input 
                              type="text" 
                              value={row.values[col.id] || ''} 
                              onChange={(e) => handleTimetableCellChange(rIdx, col.id, e.target.value)}
                              className="w-full text-center border border-zinc-300 rounded px-2 py-1 text-xs"
                            />
                          ) : (
                            <span className={!row.values[col.id] || row.values[col.id] === '-' ? 'text-zinc-400' : (row.values[col.id].includes('고등') ? 'text-amber-700' : '')}>
                              {row.values[col.id] || '-'}
                            </span>
                          )}
                        </td>
                      ))}
                      {timetableEditMode && (
                        <td className="border-l border-zinc-100 bg-zinc-50 w-24"></td>
                      )}
                      {timetableEditMode && (
                        <td className="py-4 px-4 w-20">
                          <button onClick={() => handleRemoveTimetableRow(rIdx)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg" title="행 삭제">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {timetableEditMode && (
                    <tr>
                      <td colSpan={timetableCols.length + 2} className="p-4 bg-zinc-50 text-center">
                        <button onClick={handleAddTimetableRow} className="text-sm bg-white border border-zinc-200 text-zinc-700 font-bold px-6 py-2 rounded-xl shadow-sm hover:bg-zinc-100">
                          + 새로운 행(시간대) 추가
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Monthly Calendar Section */}
            <div className="mt-24">
              <div className="text-center space-y-4 mb-12">
                <span className="text-blue-700 font-extrabold text-xs uppercase tracking-widest bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full">MONTHLY CALENDAR</span>
                <h3 className="text-2xl md:text-3xl font-black text-zinc-950">월간 시간표</h3>
                <p className="text-zinc-800 font-bold">월간 학사 일정 및 휴강일을 확인하세요.</p>
              </div>

              {isAdmin && (
                <div className="flex justify-end mb-4">
                  {calendarEditMode ? (
                    <button onClick={handleCalendarSave} className="bg-amber-600 text-zinc-950 font-bold px-5 py-2.5 rounded-xl shadow-md border border-amber-700 text-sm">
                      월간 시간표 저장
                    </button>
                  ) : (
                    <button onClick={() => setCalendarEditMode(true)} className="bg-zinc-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-md border border-zinc-700 text-sm hover:bg-zinc-800">
                      월간 시간표 편집
                    </button>
                  )}
                </div>
              )}

              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200">
                    <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <h4 className="text-xl font-black text-zinc-900">
                    {currentYear}년 {currentMonthIndex + 1}월
                  </h4>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200">
                    <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>

                <div className="flex items-center justify-end mb-4 space-x-4 text-xs font-bold text-zinc-600">
                  <div className="flex items-center"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-300 mr-1.5"></div>수업일</div>
                  <div className="flex items-center"><div className="w-3 h-3 rounded bg-red-100 border border-red-300 mr-1.5"></div>휴강일</div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 rounded-xl overflow-hidden">
                  {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                    <div key={day} className="bg-zinc-50 py-3 text-center text-xs font-black text-zinc-800">
                      {day}
                    </div>
                  ))}
                  
                  {calendarDays.map((calDay, idx) => {
                    if (!calDay) {
                      return <div key={`empty-${idx}`} className="bg-white min-h-[100px] p-2"></div>;
                    }
                    const status = monthlyCalendar[calDay.dateString];
                    let bgColorClass = 'bg-white';
                    let label = '';
                    
                    if (status === 'class') {
                      bgColorClass = 'bg-blue-50/50';
                      label = <span className="block mt-2 text-sm font-bold text-blue-700 bg-blue-100/50 border border-blue-200 px-1 py-0.5 rounded text-center">수업 예정</span>;
                    } else if (status === 'holiday') {
                      bgColorClass = 'bg-red-50/50';
                      label = <span className="block mt-2 text-sm font-bold text-red-700 bg-red-100/50 border border-red-200 px-1 py-0.5 rounded text-center">휴강</span>;
                    }

                    return (
                      <div 
                        key={calDay.dateString} 
                        onClick={() => handleCalendarDayClick(calDay.dateString)}
                        className={`${bgColorClass} min-h-[100px] p-2 hover:bg-zinc-50 transition-colors border-t border-zinc-100 relative group ${calendarEditMode ? 'cursor-pointer hover:ring-2 hover:ring-inset hover:ring-amber-400' : ''}`}
                      >
                        <span className={`text-sm font-bold block ${idx % 7 === 0 ? 'text-red-500' : idx % 7 === 6 ? 'text-blue-500' : 'text-zinc-700'}`}>
                          {calDay.day}
                        </span>
                        {label}
                        {calendarEditMode && (
                          <div className="hidden group-hover:flex absolute inset-0 bg-black/5 text-transparent hover:text-zinc-700 items-center justify-center text-xs font-extrabold transition-all duration-300">
                            변경
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Teacher Section (Reconfigured to a Single, Elegant centered profile) */}
          <section id="teachers" className="py-24 px-6 max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <span className="text-amber-700 font-extrabold text-xs uppercase tracking-widest bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full">INSTRUCTOR</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-950">APEX 대표 원장 소개</h2>
              <p className="text-zinc-800 max-w-xl mx-auto font-bold leading-relaxed">
                대치동 대형학원 오답 실무 분석가 출신의 대표원장이 직접 모든 재원생을 1:1 밀착 책임 지도합니다.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 hover:shadow-md transition-all">
                {/* Avatar */}
                <div className="w-32 h-32 md:w-40 md:h-40 bg-zinc-900 text-white rounded-full flex items-center justify-center font-extrabold text-4xl md:text-5xl shrink-0 shadow-md border border-zinc-700">
                  JS
                </div>
                
                {/* Profile detail text */}
                <div className="space-y-6 text-center md:text-left flex-1">
                  <div>
                    <h4 className="text-2xl font-black text-zinc-900">강재신 대표원장</h4>
                    <p className="text-sm text-amber-700 font-bold mt-1.5 leading-relaxed">
                      건국대학교 전기전자공학부 졸업 | 前 대치동 대형학원 총 조교장
                    </p>
                  </div>
                  
                  <p className="text-zinc-700 text-sm leading-relaxed font-bold border-l-4 border-amber-500 pl-4 text-left">
                    "수학 공부의 핵심은 본인이 어느 단계에서 막히는지 정확히 아는 것입니다. 대치동 대형학원에서 수천 명의 오답 유형과 취약 요소를 직접 분석했던 실무 경험을 바탕으로, 우리 학생들의 아주 사소한 계산 실수부터 심화 킬러 문제 해결력까지 1:1로 정확하게 짚어내겠습니다."
                  </p>
                  
                  <div className="pt-4 border-t border-zinc-150 flex flex-wrap justify-center md:justify-start gap-2.5 text-xs text-zinc-500 font-extrabold font-mono">
                    <span>#대치동오답분석가</span>
                    <span>#철저한밀착피드백</span>
                    <span>#내신A등급달성</span>
                    <span>#원리개념정복</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className="bg-zinc-100 py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <span className="text-amber-700 font-extrabold text-xs uppercase tracking-widest bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full">TESTIMONIALS</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-950">성적으로 보여주는 확실한 가치</h2>
                <p className="text-zinc-800 max-w-xl mx-auto font-bold">학생들과 학부모님들께서 직접 체험해 보고 남기신 생생한 기록입니다.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Review 1 */}
                <div className="bg-white border border-zinc-200 p-8 rounded-3xl relative shadow-sm">
                  <div className="text-amber-500 text-5xl font-display absolute top-4 left-6 opacity-20">“</div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-amber-500 text-sm">★★★★★</span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 mb-2">"기초 부족 상태에서 중등 수학 100점 달성"</h4>
                  <p className="text-zinc-700 text-xs leading-relaxed font-semibold">
                    초등학교 6학년 분수 연산도 제대로 정리가 안 되어 있었는데, 입학 후 개별 맞춤 진도 관리와 백지 진단 오답 치료를 거쳐 중3 졸업 전 마지막 수학 내신에서 드디어 100점을 쟁취했습니다.
                  </p>
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center text-xs">
                    <span className="text-zinc-900 font-extrabold">오민석 학생</span>
                    <span className="text-zinc-500 font-bold">작전중학교 3학년</span>
                  </div>
                </div>

                {/* Review 2 */}
                <div className="bg-white border border-zinc-200 p-8 rounded-3xl relative shadow-sm">
                  <div className="text-amber-500 text-5xl font-display absolute top-4 left-6 opacity-20">“</div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-amber-500 text-sm">★★★★★</span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 mb-2">"중등 서술형 문항 감점의 완벽한 예방"</h4>
                  <p className="text-zinc-700 text-xs leading-relaxed font-semibold">
                    풀이 과정 식 쓰기가 전혀 안 되어 항상 서술형 부분 감점이 누적되어 항상 아깝게 2등급에 머물렀는데, 매 주간 식 정리 백지 서술 훈련을 거치며 효성동 지역 중학교 전교 1등을 달성했습니다.
                  </p>
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center text-xs">
                    <span className="text-zinc-900 font-extrabold">이서연 학생 어머니</span>
                    <span className="text-zinc-500 font-bold">효성중학교 2학년</span>
                  </div>
                </div>

                {/* Review 3 */}
                <div className="bg-white border border-zinc-200 p-8 rounded-3xl relative shadow-sm">
                  <div className="text-amber-500 text-5xl font-display absolute top-4 left-6 opacity-20">“</div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-amber-500 text-sm">★★★★★</span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 mb-2">"매일 전송되는 소통 레포트에 대만족"</h4>
                  <p className="text-zinc-700 text-xs leading-relaxed font-semibold">
                    매 수업 종료 후 자녀의 당일 학습 현황과 실전 기출 성적이 전송되니 집에서도 안심하고 교육 과정을 지켜볼 수 있었습니다. 억지로 가는 학원이 아니라 스스로 수학의 흥미를 되찾았네요.
                  </p>
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center text-xs">
                    <span className="text-zinc-900 font-extrabold">김태준 학부모님</span>
                    <span className="text-zinc-500 font-bold">작전현대중학교 1학년</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Consultation / Map Section */}
          <section id="consultation" className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Contact Information & Map */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <span className="text-amber-700 font-extrabold text-xs uppercase tracking-widest bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full">CONTACT US</span>
                <h2 className="text-3xl md:text-4xl font-black text-zinc-955">오시는 길 및 문의처</h2>
                <p className="text-zinc-800 font-bold text-sm leading-relaxed">
                  편하신 시간에 방문 및 예약하셔서 자녀의 실력 무료 테스트 및 맞춤 공부 비법을 상담받아 보세요.
                </p>
              </div>

              <div className="space-y-5 text-sm text-zinc-800 font-bold">
                <div className="flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-zinc-955 block font-black mb-0.5">학원 주소</strong>
                    <span className="text-zinc-900 block">인천 계양구 효서로363번길 4-1 2층</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-zinc-955 block font-black mb-0.5">대표 유선 상담 번호</strong>
                    <span className="text-amber-750 font-black text-lg font-display tracking-tight">032-555-7890</span>
                    <span className="text-zinc-505 block text-xs mt-0.5 font-bold">(전화 상담 가능 시간: 평일 오후 1시 ~ 10시)</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-zinc-955 block font-black mb-0.5">학원 수업 시간</strong>
                    <span className="text-zinc-900 block">평일: 오후 2시 ~ 10시 | 주말: 오전 10시 ~ 오후 5시</span>
                  </div>
                </div>
              </div>

              {/* Embedded Map */}
              <div className="h-[280px] w-full border border-zinc-200 rounded-3xl overflow-hidden relative shadow-sm">
                <iframe 
                  src="https://maps.google.com/maps?q=인천%20계양구%20효서로363번길%204-1&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy"
                ></iframe>
                <div className="absolute bottom-4 right-4 z-10">
                  <a 
                    href="https://map.naver.com/v5/search/인천%20계양구%20효서로363번길%204-1%202층"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#03C75A] hover:bg-[#02b34f] text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition-colors border border-green-600"
                  >
                    <span>Naver 지도로 길 찾기</span>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Consultation Request Form / Admin Viewer */}
            <div className="lg:col-span-7 bg-white border border-zinc-250 p-8 md:p-12 rounded-3xl shadow-sm relative h-full flex flex-col">
              {isAdmin ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-zinc-955">상담 신청 내역 조회</h3>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                      총 {consultationRequests.length}건
                    </span>
                  </div>
                  
                  {consultationRequests.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 font-bold border border-zinc-200 rounded-2xl bg-zinc-50 flex-1 flex items-center justify-center">
                      접수된 상담 신청 내역이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {consultationRequests.map(req => (
                        <div key={req.id} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 hover:border-amber-400 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg font-black text-zinc-900">{req.studentName} 학생</span>
                                <span className="text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded text-zinc-600 font-bold">
                                  {req.grade === 'elementary45' ? '초등부(4~5학년)' : 
                                   req.grade === 'elementary6' ? '초등부(6학년)' :
                                   req.grade === 'middle1' ? '중등부(1학년)' :
                                   req.grade === 'middle2' ? '중등부(2학년)' : '중등부(3학년)'}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-500 font-bold">{req.date} 접수</div>
                            </div>
                            <button onClick={() => handleDeleteConsultation(req.id)} className="text-red-500 hover:text-red-700 bg-white border border-red-100 p-1.5 rounded-lg shadow-sm" title="내역 삭제">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm font-bold bg-white p-3 rounded-xl border border-zinc-150">
                            <div>
                              <span className="text-zinc-500 block text-xs mb-0.5">학부모 성함</span>
                              <span className="text-zinc-900">{req.parentName}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-xs mb-0.5">연락처</span>
                              <span className="text-amber-700">{req.phoneNumber}</span>
                            </div>
                          </div>
                          
                          {req.message && (
                            <div className="text-sm font-bold bg-white p-4 rounded-xl border border-zinc-150">
                              <span className="text-zinc-500 block text-xs mb-1.5">요청사항</span>
                              <p className="text-zinc-800 whitespace-pre-wrap">{req.message}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : formSubmitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-full border border-amber-500 flex items-center justify-center text-amber-600 shadow-lg">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-zinc-950">상담 신청 성공 완료</h3>
                    <p className="text-zinc-800 text-sm max-w-sm mx-auto leading-relaxed font-bold">
                      상담 접수가 무사히 완료되었습니다. 등록하신 정보로 24시간 내외에 학원 대표 상담실에서 연락드리겠습니다.
                    </p>
                  </div>
                  <button 
                    onClick={resetForm}
                    className="bg-zinc-900 hover:bg-amber-600 text-white font-extrabold px-6 py-3 rounded-xl transition-all duration-300 text-sm shadow-md border border-zinc-700"
                  >
                    추가 다른 상담 신청하기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6 flex-1 flex flex-col">
                  <div className="space-y-2 mb-2">
                    <h3 className="text-2xl font-black text-zinc-955">무료 실력 진단 및 학습 컨설팅 신청</h3>
                    <p className="text-zinc-800 text-xs font-bold">
                      필수 입력 요소(*)를 기재해 주시면, 맞춤 대입 솔루션을 위한 방문 일정을 조율해 드립니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-zinc-850 block">학생 이름 <span className="text-amber-600">*</span></label>
                      <input 
                        type="text" 
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        placeholder="이름을 입력하세요"
                        className="w-full bg-white border border-zinc-355 rounded-xl px-4 py-3 text-zinc-950 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors font-bold"
                        required
                      />
                    </div>

                    {/* Parent Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-zinc-850 block">학부모 성함 <span className="text-amber-600">*</span></label>
                      <input 
                        type="text" 
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleInputChange}
                        placeholder="성함을 입력하세요"
                        className="w-full bg-white border border-zinc-355 rounded-xl px-4 py-3 text-zinc-950 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-zinc-850 block">학부모 연락처 <span className="text-amber-600">*</span></label>
                      <input 
                        type="tel" 
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="010-0000-0000"
                        className="w-full bg-white border border-zinc-355 rounded-xl px-4 py-3 text-zinc-950 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors font-bold"
                        required
                      />
                    </div>

                    {/* Grade Level Select */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-zinc-850 block">학생 현재 학년 <span className="text-amber-600">*</span></label>
                      <select 
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-zinc-355 rounded-xl px-4 py-3 text-zinc-850 text-sm focus:border-amber-500 focus:outline-none transition-colors font-bold"
                      >
                        <option value="elementary45">초등부 (4~5학년)</option>
                        <option value="elementary6">초등부 (6학년)</option>
                        <option value="middle1">중등부 (1학년)</option>
                        <option value="middle2">중등부 (2학년)</option>
                        <option value="middle3">중등부 (3학년)</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Textarea */}
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <label className="text-xs font-extrabold text-zinc-855 block">학생의 취약 부위 및 주요 요청사항</label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="4" 
                      placeholder="예) 중등과정 선행 여부, 서술형 문항 고민 등..."
                      className="w-full flex-1 min-h-[100px] bg-white border border-zinc-355 rounded-xl px-4 py-3 text-zinc-950 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors resize-none font-bold"
                    ></textarea>
                  </div>

                  {/* Submission Button */}
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full mt-6 bg-amber-600 hover:bg-amber-500 text-zinc-955 font-black py-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 text-base border border-amber-700"
                  >
                    {isSubmitting ? (
                      <React.Fragment>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-955" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>신청서 접수 중...</span>
                      </React.Fragment>
                    ) : (
                      <span>무료 학습 진단 신청서 보내기</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Footer Section */}
          <footer className="bg-zinc-955 border-t border-zinc-900 text-zinc-300 py-16 px-6 mt-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
              {/* Branding */}
              <div className="md:col-span-5 space-y-6">
                <a href="#" className="flex items-center space-x-2.5 text-white">
                  <div className="w-8 h-8 rounded-lg bg-white text-zinc-955 flex items-center justify-center font-bold text-base shadow">
                    Σ
                  </div>
                  <span className="font-display font-extrabold text-xl tracking-wider">
                    APEX <span className="text-amber-500 font-sans font-bold text-sm ml-0.5">수학학원</span>
                  </span>
                </a>
                <p className="text-xs text-zinc-400 font-bold leading-relaxed max-w-sm">
                  (주)에이펙스교육그룹 | 대표자: 강재신 원장<br />
                  주소: 인천 계양구 효서로363번길 4-1 2층<br />
                  사업자등록번호: 120-00-56789 | 학원등록번호: 계양 제2048호
                </p>
                <div className="text-xs text-zinc-500 font-bold">
                  &copy; 2026 APEX Math Academy. All rights reserved.
                </div>
              </div>

              {/* Quick links */}
              <div className="md:col-span-3 space-y-4">
                <h5 className="text-white font-bold text-sm">바로가기</h5>
                <ul className="text-xs space-y-2.5 font-bold">
                  <li><a href="#features" className="hover:text-amber-500 transition-colors">학원 소개 및 강점</a></li>
                  <li><a href="#curriculum" className="hover:text-amber-500 transition-colors">학년별 커리큘럼</a></li>
                  <li><a href="#teachers" className="hover:text-amber-500 transition-colors">대표 원장 소개</a></li>
                  <li><a href="#testimonials" className="hover:text-amber-500 transition-colors">성적 향상 후기</a></li>
                </ul>
              </div>

              {/* Consultation notice */}
              <div className="md:col-span-4 space-y-4">
                <h5 className="text-white font-bold text-sm">안심 귀가 안심 출결 알림</h5>
                <p className="text-xs text-zinc-400 leading-relaxed font-bold">
                  APEX 수학학원은 등원 및 하원 시 쪽지시험 결과, 참여도를 자동으로 문자로 발송하고 있습니다.
                </p>
                <div className="flex items-center space-x-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </footer>

          {/* Curriculum Modal Popover */}
          {selectedCurriculumDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                onClick={() => setSelectedCurriculumDetail(null)}
                className="absolute inset-0 bg-zinc-955/80 backdrop-blur-sm"
              ></div>
              <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <button 
                  onClick={() => setSelectedCurriculumDetail(null)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="space-y-2">
                  <span className="text-xs text-amber-400 font-bold bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">코스 진도 상세 설명</span>
                  <h3 className="text-2xl font-black text-white pt-2">{selectedCurriculumDetail.name}</h3>
                  <div className="flex items-center text-xs text-zinc-200 space-x-1.5 font-bold pt-1">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>강의 스케줄: {selectedCurriculumDetail.schedule}</span>
                  </div>
                </div>
                <div className="space-y-4 py-2 border-t border-zinc-850 text-sm text-zinc-300 leading-relaxed font-bold">
                  <p>{selectedCurriculumDetail.desc}</p>
                  <div className="bg-zinc-955 border border-zinc-850 p-4 rounded-xl text-xs text-zinc-300 space-y-2">
                    <strong className="text-white font-bold block mb-1">학습 단원 로드맵:</strong>
                    {selectedCurriculumDetail.details}
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setSelectedCurriculumDetail(null)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    닫기
                  </button>
                  <a 
                    href="#consultation"
                    onClick={() => setSelectedCurriculumDetail(null)}
                    className="flex-1 bg-amber-600 text-zinc-950 text-center font-bold py-3.5 rounded-xl transition-colors text-sm block hover:bg-amber-500"
                  >
                    이 수업으로 상담하기
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Quick Registration Floating Modal */}
          {consultationModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                onClick={() => setConsultationModalOpen(false)}
                className="absolute inset-0 bg-zinc-955/80 backdrop-blur-sm"
              ></div>
              <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <button 
                  onClick={() => setConsultationModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white">무료 청강 신청</h3>
                  <p className="text-zinc-300 text-xs font-light">
                    실제 APEX 수학학원 원장 직강 수업을 1회 무료 예약 참관하여 학원만의 집중 클리닉을 확인해 보세요.
                  </p>
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setConsultationModalOpen(false);
                    showToastMessage('청강 신청이 완료되었습니다! 안내 전화를 드리겠습니다.');
                  }} 
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">학생 성명</label>
                    <input 
                      type="text" 
                      placeholder="성명을 입력하세요"
                      className="w-full bg-brand-dark border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">학부모 연락처</label>
                    <input 
                      type="tel" 
                      placeholder="010-0000-0000"
                      className="w-full bg-brand-dark border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">청강 참관 과정</label>
                    <select className="w-full bg-brand-dark border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400 text-sm focus:border-amber-500 focus:outline-none transition-colors">
                      <option>초등 기본/심화 해결 과정</option>
                      <option>중등 내신 대비 과정</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-amber-600 text-zinc-950 hover:bg-amber-500 font-bold py-4 rounded-xl shadow-lg transition-colors text-sm"
                  >
                    청강 예약 완료하기
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* Admin Login Modal */}
          {loginModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                onClick={() => setLoginModalOpen(false)}
                className="absolute inset-0 bg-zinc-955/80 backdrop-blur-sm"
              ></div>
              <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <button 
                  onClick={() => setLoginModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 mb-4 border border-zinc-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <h3 className="text-2xl font-black text-white">관리자 로그인</h3>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      placeholder="아이디"
                      value={loginForm.id}
                      onChange={(e) => setLoginForm({...loginForm, id: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <input 
                      type="password" 
                      placeholder="비밀번호"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-amber-600 text-zinc-950 hover:bg-amber-500 font-bold py-3.5 rounded-xl shadow-lg transition-colors text-sm"
                  >
                    로그인
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Notice Write Modal */}
          {noticeWriteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                onClick={() => setNoticeWriteModalOpen(false)}
                className="absolute inset-0 bg-zinc-955/80 backdrop-blur-sm"
              ></div>
              <div className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl space-y-6">
                <button 
                  onClick={() => setNoticeWriteModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-zinc-900">새 공지사항 작성</h3>
                </div>
                
                <form onSubmit={handleNoticeSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 block">제목</label>
                    <input 
                      type="text" 
                      placeholder="공지사항 제목을 입력하세요"
                      value={noticeForm.title}
                      onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:border-amber-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 block">내용</label>
                    <textarea 
                      placeholder="공지사항 내용을 입력하세요"
                      value={noticeForm.content}
                      onChange={(e) => setNoticeForm({...noticeForm, content: e.target.value})}
                      rows="8"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:border-amber-500 focus:outline-none transition-colors resize-none"
                      required
                    ></textarea>
                  </div>
                  <div className="space-y-1 border border-dashed border-zinc-300 rounded-xl p-4 bg-zinc-50">
                    <label className="text-xs font-bold text-zinc-500 block mb-2">첨부파일 (최대 2MB)</label>
                    <input 
                      type="file" 
                      onChange={handleNoticeFileChange}
                      className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                    />
                    {noticeForm.fileName && <p className="text-xs text-zinc-500 mt-2">선택된 파일: {noticeForm.fileName}</p>}
                  </div>
                  <div className="pt-4 flex justify-end space-x-3">
                    <button 
                      type="button"
                      onClick={() => setNoticeWriteModalOpen(false)}
                      className="px-6 py-3 border border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 transition-colors text-sm"
                    >
                      취소
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors text-sm shadow-md"
                    >
                      등록하기
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
}
