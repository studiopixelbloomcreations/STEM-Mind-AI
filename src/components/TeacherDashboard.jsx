import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, UserPlus, LogOut, Award, AlertTriangle, 
  Lightbulb, ChevronRight, BarChart2, BookOpen, Clock, Play
} from 'lucide-react';

export default function TeacherDashboard() {
  const { 
    user, students, registerStudent, setActiveStudent, 
    getStudentHistoryAndAnalytics, handleLogout 
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('10');
  const [age, setAge] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');

  const subjectsList = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];

  // Toggle subject selection
  const handleSubjectToggle = (subj) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(prev => prev.filter(s => s !== subj));
    } else {
      setSelectedSubjects(prev => [...prev, subj]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !age || selectedSubjects.length === 0) {
      setError('Please fill out all fields and select at least one subject.');
      return;
    }
    setError('');
    try {
      await registerStudent(name, grade, age, selectedSubjects);
      setName('');
      setAge('');
      setSelectedSubjects([]);
      setShowAddForm(false);
    } catch (err) {
      setError('Registration failed. Try again.');
    }
  };

  // Fetch detailed history and analytics when a student is selected
  useEffect(() => {
    if (selectedStudent) {
      const loadDetails = async () => {
        setLoadingDetails(true);
        const details = await getStudentHistoryAndAnalytics(selectedStudent.id);
        setStudentDetails(details);
        setLoadingDetails(false);
      };
      loadDetails();
    } else {
      setStudentDetails(null);
    }
  }, [selectedStudent, students]);

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <nav className="navbar" style={{ padding: '0 40px' }}>
        <div className="nav-logo">
          <span>STEMMind AI</span>
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userEmail}>{user?.email}</span>
          <button onClick={handleLogout} className="btn-secondary" style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main dashboard content layout */}
      <div style={styles.dashboardBody}>
        {/* Left student list sidebar */}
        <aside style={styles.sidebar} className="card-glass">
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarTitleWrap}>
              <Users size={20} style={{ color: '#8b5cf6' }} />
              <h2>Students</h2>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn-primary" 
              style={styles.addBtn}
            >
              <UserPlus size={16} />
              <span>Add</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleRegister} style={styles.form} className="card-glass">
              <h3>Register Student</h3>
              {error && <div style={styles.errorText}>{error}</div>}
              <input
                type="text"
                placeholder="Student Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                style={styles.formInput}
              />
              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="input-field"
                style={styles.formInput}
              />
              <div style={styles.formInput}>
                <label style={styles.label}>Grade</label>
                <select 
                  value={grade} 
                  onChange={e => setGrade(e.target.value)}
                  className="input-field"
                >
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                </select>
              </div>

              <div style={styles.formInput}>
                <label style={styles.label}>Subjects</label>
                <div style={styles.subjectsCheckboxGroup}>
                  {subjectsList.map(subj => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => handleSubjectToggle(subj)}
                      style={{
                        ...styles.subjTag,
                        backgroundColor: selectedSubjects.includes(subj) ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        borderColor: selectedSubjects.includes(subj) ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Register Profile
              </button>
            </form>
          )}

          <div style={styles.studentList}>
            {students.length === 0 ? (
              <p style={styles.emptyText}>No students registered yet.</p>
            ) : (
              students.map(student => (
                <div 
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  style={{
                    ...styles.studentItem,
                    borderColor: selectedStudent?.id === student.id ? '#8b5cf6' : 'transparent',
                    background: selectedStudent?.id === student.id ? 'rgba(139, 92, 246, 0.06)' : 'transparent'
                  }}
                >
                  <div>
                    <h4 style={styles.studentName}>{student.name}</h4>
                    <span style={styles.studentMeta}>Grade {student.grade} • Age {student.age}</span>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right dashboard detail panel */}
        <main style={styles.detailContainer}>
          {selectedStudent ? (
            <div style={styles.studentDetails}>
              {/* Profile banner */}
              <div style={styles.detailsHeader} className="card-glass">
                <div>
                  <h1 style={styles.profileName}>{selectedStudent.name}</h1>
                  <p style={styles.profileMeta}>
                    Registered subjects: {selectedStudent.subjects.join(', ')}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveStudent(selectedStudent)} 
                  className="btn-primary"
                  style={styles.startSessionBtn}
                >
                  <Play size={16} />
                  <span>Start Learning Hub</span>
                </button>
              </div>

              {loadingDetails ? (
                <div style={styles.loadingWrapper} className="shimmer card-glass">
                  <h3>Analyzing Council Records...</h3>
                </div>
              ) : studentDetails ? (
                <div style={styles.gridContainer}>
                  {/* Left Column: Stats & Recommendations */}
                  <div style={styles.columnLeft}>
                    {/* Mastery Stats */}
                    <div style={styles.detailsCard} className="card-glass">
                      <div style={styles.sectionTitleWrap}>
                        <Award size={20} style={{ color: '#10b981' }} />
                        <h3>Topic Mastery Progress</h3>
                      </div>
                      {Object.keys(studentDetails.analytics.topic_mastery || {}).length === 0 ? (
                        <p style={styles.emptyText}>No quizzes completed yet.</p>
                      ) : (
                        <div style={styles.masteryList}>
                          {Object.entries(studentDetails.analytics.topic_mastery).map(([topic, level]) => (
                            <div key={topic} style={styles.masteryItem}>
                              <span>{topic}</span>
                              <span style={{
                                ...styles.masteryBadge,
                                color: level === 'Master' ? '#10b981' : level === 'Proficient' ? '#3b82f6' : '#f59e0b',
                                backgroundColor: level === 'Master' ? 'rgba(16, 185, 129, 0.1)' : level === 'Proficient' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                              }}>
                                {level}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div style={styles.detailsCard} className="card-glass">
                      <div style={styles.sectionTitleWrap}>
                        <Lightbulb size={20} style={{ color: '#f59e0b' }} />
                        <h3>Study Insights & Next Steps</h3>
                      </div>
                      {studentDetails.analytics.strengths.length === 0 && studentDetails.analytics.weaknesses.length === 0 ? (
                        <p style={styles.emptyText}>Start a quiz session to generate real-time AI study insights.</p>
                      ) : (
                        <div style={styles.insightsWrapper}>
                          <div style={styles.insightBlock}>
                            <h4 style={{ color: '#10b981' }}>Strengths Detected</h4>
                            <ul>
                              {studentDetails.analytics.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                            </ul>
                          </div>
                          <div style={styles.insightBlock}>
                            <h4 style={{ color: '#ef4444' }}>Target Weaknesses</h4>
                            <ul>
                              {studentDetails.analytics.weaknesses.map((weak, idx) => <li key={idx}>{weak}</li>)}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Quiz Attempts history log */}
                  <div style={styles.columnRight} className="card-glass">
                    <div style={styles.sectionTitleWrap}>
                      <BarChart2 size={20} style={{ color: '#8b5cf6' }} />
                      <h3>Recent Quiz History</h3>
                    </div>
                    {studentDetails.quizzes.length === 0 ? (
                      <p style={styles.emptyText}>No quizzes attempts found.</p>
                    ) : (
                      <div style={styles.quizLog}>
                        {studentDetails.quizzes.map(quiz => (
                          <div key={quiz.id} style={styles.quizLogItem}>
                            <div style={styles.quizMeta}>
                              <div style={styles.quizTopic}>{quiz.topic}</div>
                              <div style={styles.quizSubInfo}>
                                <BookOpen size={12} /> {quiz.subject} &bull; <Clock size={12} /> {quiz.time_spent}s
                              </div>
                            </div>
                            <div style={{
                              ...styles.quizScore,
                              color: quiz.score >= 80 ? '#10b981' : quiz.score >= 50 ? '#3b82f6' : '#ef4444'
                            }}>
                              {quiz.score}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Users size={64} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>Select a student profile from the sidebar to view metrics, custom AI insights, and start studying.</h3>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userEmail: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  logoutBtn: {
    padding: '8px 16px',
  },
  dashboardBody: {
    flex: 1,
    display: 'flex',
    padding: '24px 40px',
    gap: '32px',
    maxWidth: '1440px',
    margin: '0 auto',
    width: '100%',
  },
  sidebar: {
    width: '320px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 128px)',
    overflowY: 'auto',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  sidebarTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  addBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
  },
  form: {
    padding: '16px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formInput: {
    padding: '10px 12px',
    fontSize: '0.9rem',
  },
  label: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
    display: 'block',
  },
  subjectsCheckboxGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '4px',
  },
  subjTag: {
    border: '1px solid',
    borderRadius: '100px',
    padding: '6px 12px',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '0.82rem',
    marginBottom: '8px',
  },
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  studentItem: {
    border: '1px solid transparent',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  studentName: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '2px',
  },
  studentMeta: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  detailContainer: {
    flex: 1,
    minHeight: 'calc(100vh - 128px)',
  },
  studentDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  detailsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: '2rem',
    fontWeight: '700',
  },
  profileMeta: {
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  startSessionBtn: {
    gap: '10px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '24px',
  },
  columnLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  columnRight: {
    padding: '24px',
  },
  detailsCard: {
    padding: '24px',
  },
  sectionTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  masteryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  masteryItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
  },
  masteryBadge: {
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '100px',
  },
  insightsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  insightBlock: {
    background: 'rgba(255, 255, 255, 0.01)',
    borderRadius: '8px',
    padding: '14px',
  },
  quizLog: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  quizLogItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  quizMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  quizTopic: {
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  quizSubInfo: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  quizScore: {
    fontSize: '1.2rem',
    fontWeight: '800',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '80px 40px',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  loadingWrapper: {
    padding: '80px',
    textAlign: 'center',
  }
};
