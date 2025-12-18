// Curriculum Master Data - Branch + Semester → Subjects Mapping
// This provides the complete syllabus data for dynamic subject filtering

export interface CurriculumData {
  [branch: string]: {
    [semester: string]: string[];
  };
}

export const BRANCHES = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Artificial Intelligence & Data Science',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Civil Engineering',
  'Mechanical Engineering'
] as const;

export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const CURRICULUM: CurriculumData = {
  'Computer Science & Engineering': {
    '1': [
      'Communicative English',
      'Linear Algebra & Calculus',
      'Engineering Physics',
      'Introduction to Programming',
      'Engineering Graphics',
      'Communicative English Lab',
      'Engineering Physics Lab',
      'Computer Programming Lab',
      'IT Workshop',
      'NSS / NCC / Scouts & Guides / Community Service'
    ],
    '2': [
      'Differential Equations & Vector Calculus',
      'Chemistry',
      'Basic Electrical & Electronics Engineering',
      'Data Structures',
      'Basic Civil & Mechanical Engineering',
      'Chemistry Lab',
      'Electrical & Electronics Engineering Workshop',
      'Engineering Workshop',
      'Data Structures Lab',
      'Health and Wellness, Yoga and Sports'
    ],
    '3': [
      'Discrete Mathematics & Graph Theory',
      'Universal Human Values – Understanding Harmony and Ethical Human Conduct',
      'Digital Logic & Computer Organization',
      'Advanced Data Structures & Algorithm Analysis',
      'Object Oriented Programming Through Java',
      'Advanced Data Structures & Algorithm Analysis Lab',
      'Object Oriented Programming Through Java Lab',
      'Python Programming',
      'Environmental Science'
    ],
    '4': [
      'Managerial Economics and Financial Analysis',
      'Probability & Statistics',
      'Operating Systems',
      'Database Management Systems',
      'Software Engineering',
      'Operating Systems Lab',
      'Database Management Systems Lab',
      'Full Stack Development – I',
      'Design Thinking and Innovation'
    ],
    '5': [
      'Data Warehousing and Data Mining',
      'Computer Networks',
      'Formal Languages and Automata Theory',
      'Professional Elective – I',
      'Open Elective – I',
      'Data Mining Lab',
      'Computer Networks Lab',
      'Full Stack Development – II',
      'User Interface Design using Flutter'
    ],
    '6': [
      'Compiler Design',
      'Cloud Computing',
      'Cryptography & Network Security',
      'Professional Elective – II',
      'Professional Elective – III',
      'Cryptography & Network Security Lab',
      'Soft Skills / Swayam / NPTEL',
      'Technical Paper Writing / IPR'
    ],
    '7': [],
    '8': []
  },

  'Artificial Intelligence & Machine Learning': {
    '1': [
      'Communicative English',
      'Linear Algebra & Calculus',
      'Chemistry',
      'Introduction to Programming',
      'Basic Civil & Mechanical Engineering',
      'Communicative English Lab',
      'Chemistry Lab',
      'Computer Programming Lab',
      'Engineering Workshop',
      'Health and Wellness, Yoga and Sports'
    ],
    '2': [
      'Differential Equations & Vector Calculus',
      'Engineering Physics',
      'Basic Electrical & Electronics Engineering',
      'Data Structures',
      'Engineering Graphics',
      'Engineering Physics Lab',
      'Electrical & Electronics Engineering Workshop',
      'IT Workshop',
      'Data Structures Lab',
      'NSS / NCC / Scouts & Guides / Community Service'
    ],
    '3': [
      'Discrete Mathematics & Graph Theory',
      'Universal Human Values – 2 (Understanding Harmony)',
      'Artificial Intelligence',
      'Advanced Data Structures & Algorithms Analysis',
      'Object Oriented Programming Through Java',
      'Advanced Data Structures & Algorithms Analysis Lab',
      'Object Oriented Programming Through Java Lab',
      'Python Programming Lab',
      'Environmental Science'
    ],
    '4': [
      'Optimization Techniques',
      'Probability & Statistics',
      'Machine Learning',
      'Database Management Systems',
      'Digital Logic & Computer Organization',
      'Machine Learning Lab',
      'Database Management Systems Lab',
      'Full Stack Development – I',
      'Design Thinking & Innovation'
    ],
    '5': [
      'Deep Learning',
      'Computer Networks',
      'Operating Systems',
      'Professional Elective – I',
      'Open Elective – I',
      'Deep Learning Lab',
      'Operating Systems & Computer Networks Lab',
      'Full Stack Development – II',
      'Semester Focused Design Flutter / Development with Flutter'
    ],
    '6': [
      'Reinforcement Learning',
      'Software Engineering',
      'Data Visualization',
      'Professional Elective – II',
      'Professional Elective – III',
      'Open Elective – II',
      'Software Engineering Lab',
      'Data Visualization Lab',
      'Soft Skills / SWAYAM Plus – 21st Century Employability Skills',
      'Technical Paper Writing & IPR'
    ],
    '7': [],
    '8': []
  },

  'Artificial Intelligence & Data Science': {
    '1': [
      'Communicative English',
      'Linear Algebra & Calculus',
      'Chemistry',
      'Introduction to Programming',
      'Basic Civil & Mechanical Engineering',
      'Communicative English Lab',
      'Chemistry Lab',
      'Computer Programming Lab',
      'Engineering Workshop',
      'Health and Wellness, Yoga and Sports'
    ],
    '2': [
      'Differential Equations & Vector Calculus',
      'Engineering Physics',
      'Basic Electrical & Electronics Engineering',
      'Data Structures',
      'Engineering Graphics',
      'Engineering Physics Lab',
      'Electrical & Electronics Engineering Workshop',
      'IT Workshop',
      'Data Structures Lab',
      'NSS / NCC / Scouts & Guides / Community Service'
    ],
    '3': [
      'Discrete Mathematics & Graph Theory',
      'Universal Human Values – 2: Understanding Harmony',
      'Database Management Systems',
      'Advanced Data Structures & Algorithms',
      'Object Oriented Programming Through Java',
      'Advanced Data Structures & Algorithms Lab',
      'Object Oriented Programming Through Java Lab',
      'Python Programming Lab',
      'Environmental Science'
    ],
    '4': [
      'Managerial Economics and Financial Analysis',
      'Statistical Methods for Data Science',
      'Artificial Intelligence',
      'Introduction to Data Science',
      'Digital Logic & Computer Organization',
      'Artificial Intelligence Lab',
      'Data Science using Python Lab',
      'Full Stack Development – I',
      'Design Thinking & Innovation'
    ],
    '5': [
      'Data Warehousing and Data Mining',
      'Principles of Machine Learning',
      'Software Engineering',
      'Professional Elective – I',
      'Open Elective – I',
      'Data Warehousing and Data Mining Lab',
      'Software Engineering Lab',
      'Full Stack Development – II',
      'Swayam Plus – Data Engineering / AI',
      'User Interfaces using Flutter / DevOps with Android Application Development'
    ],
    '6': [
      'Operating Systems',
      'Deep Learning',
      'Professional Elective – II',
      'Professional Elective – III',
      'Open Elective – II',
      'Deep Learning Lab',
      'Operating Systems & Computer Networks Lab',
      'Soft Skills / Swayam Plus – 21st Century Employability Skills',
      'Technical Paper Writing & IPR'
    ],
    '7': [],
    '8': []
  },

  'Information Technology': {
    '1': [
      'Communicative English',
      'Linear Algebra & Calculus',
      'Chemistry',
      'Introduction to Programming',
      'Basic Civil & Mechanical Engineering',
      'Communicative English Lab',
      'Chemistry Lab',
      'Computer Programming Lab',
      'Engineering Workshop',
      'Health and Wellness, Yoga and Sports'
    ],
    '2': [
      'Differential Equations & Vector Calculus',
      'Engineering Physics',
      'Basic Electrical & Electronics Engineering',
      'Data Structures',
      'Engineering Graphics',
      'Engineering Physics Lab',
      'Electrical & Electronics Engineering Workshop',
      'IT Workshop',
      'Data Structures Lab',
      'NSS / NCC / Scouts & Guides / Community Service'
    ],
    '3': [
      'Discrete Mathematics & Graph Theory',
      'Universal Human Values – 2',
      'Digital Logic & Computer Organization',
      'Advanced Data Structures & Algorithm Analysis',
      'Object Oriented Programming Through Java',
      'Advanced Data Structures and Algorithm Analysis Lab',
      'Object Oriented Programming Through Java Lab',
      'Python Programming',
      'Environmental Science'
    ],
    '4': [
      'Optimization Techniques',
      'Probability & Statistics',
      'Operating Systems',
      'Database Management Systems',
      'Software Engineering',
      'Operating Systems Lab',
      'Database Management Systems Lab',
      'Python with Django',
      'Design Thinking & Innovation'
    ],
    '5': [
      'Advanced Java',
      'Data Communication and Computer Networks',
      'Automata Theory & Compiler Design',
      'Professional Elective – I',
      'Advanced Java Lab',
      'Computer Networks Lab',
      'User Interface Designing using Flutter',
      'Community Service Internship'
    ],
    '6': [
      'Cloud Computing',
      'Cryptography & Network Security',
      'Data Warehousing & Data Mining',
      'Professional Elective – II',
      'Professional Elective – III',
      'Open Elective – II',
      'Data Mining Lab',
      'Soft Skills / SWAYAM Plus – 21st Century Employability Skills'
    ],
    '7': [],
    '8': []
  },

  'Electronics & Communication Engineering': {
    '1': [
      'Communicative English',
      'Linear Algebra & Calculus',
      'Engineering Physics',
      'Basic Electrical and Electronics Engineering',
      'Engineering Graphics',
      'Communicative English Lab',
      'Engineering Physics Lab',
      'Electrical & Electronics Engineering Workshop',
      'IT Workshop',
      'NSS / NCC / Scouts & Guides / Community Service'
    ],
    '2': [
      'Differential Equations & Vector Calculus',
      'Chemistry',
      'Introduction to Programming',
      'Basic Civil & Mechanical Engineering',
      'Network Analysis',
      'Chemistry Lab',
      'Computer Programming Lab',
      'Engineering Workshop',
      'Network Analysis & Simulation Lab',
      'Health and Wellness, Yoga and Sports'
    ],
    '3': [
      'Probability Theory & Stochastic Processes',
      'Managerial Economics & Financial Analysis',
      'Signals and Systems',
      'Electronic Devices and Circuits',
      'Switching Theory and Logic Design',
      'Electronic Devices and Circuits Lab',
      'Signals and Systems Lab',
      'Switching Theory and Logic Design Lab',
      'Data Structures using Python',
      'Environmental Science'
    ],
    '4': [
      'Universal Human Values – Understanding Harmony and Ethical Human Conduct',
      'Linear Control Systems',
      'Electromagnetic Waves and Transmission Lines',
      'Electronic Circuit Analysis',
      'Analog Communications',
      'Analog Communications Lab',
      'Electronic Circuit Analysis Lab',
      'Soft Skills',
      'Design Thinking & Innovation Mini Project'
    ],
    '5': [
      'Analog & Digital IC Applications',
      'Microprocessors & Microcontrollers',
      'Digital Communications',
      'Professional Elective – I',
      'Open Elective – I',
      'Analog & Digital IC Applications Lab',
      'Digital Communication Lab',
      'Microprocessors & Microcontrollers Lab',
      'Machine Learning Lab'
    ],
    '6': [
      'VLSI Design',
      'Antennas and Wave Propagation',
      'Digital Signal Processing',
      'Professional Elective – II',
      'Professional Elective – III',
      'Open Elective – II',
      'VLSI Design Lab',
      'Microwave and Optical Communication Lab',
      'Instrumentation & Communications Lab',
      'Research Methodology & IPR'
    ],
    '7': [],
    '8': []
  },

  'Electrical & Electronics Engineering': {
    '1': [
      'Communicative English',
      'Linear Algebra & Calculus',
      'Engineering Physics',
      'Basic Electrical and Electronics Engineering',
      'Engineering Graphics',
      'Communicative English Lab',
      'Engineering Physics Lab',
      'Electrical and Electronics Engineering Workshop',
      'IT Workshop',
      'NSS / NCC / Scouts & Guides / Community Service'
    ],
    '2': [
      'Differential Equations & Vector Calculus',
      'Chemistry',
      'Introduction to Programming',
      'Electrical Circuit Analysis – I',
      'Basic Civil & Mechanical Engineering',
      'Chemistry Lab',
      'Computer Programming Lab',
      'Engineering Workshop',
      'Electrical Circuits Lab',
      'Health and Wellness, Yoga and Sports'
    ],
    '3': [
      'Numerical Methods & Complex Variables',
      'Managerial Economics & Financial Analysis',
      'Electromagnetic Field Theory',
      'Electrical Circuit Analysis – II',
      'DC Machines & Transformers',
      'Electrical Circuit Analysis – II and Simulation Lab',
      'DC Machines & Transformers Lab',
      'Data Structures Lab',
      'Environmental Science'
    ],
    '4': [
      'Universal Human Values – Understanding Harmony and Ethical Human Conduct',
      'Analog Circuits',
      'Power Systems – I',
      'Induction and Synchronous Machines',
      'Control Systems',
      'Induction and Synchronous Machines Lab',
      'Control Systems Lab',
      'Python Programming Lab',
      'Design Thinking & Innovation'
    ],
    '5': [
      'Power Electronics',
      'Digital Circuits',
      'Power Systems – II',
      'Professional Elective – I',
      'Open Elective – I',
      'Power Electronics Lab',
      'Analog and Digital Circuits Lab',
      'Soft Skills',
      'Tinkering Lab'
    ],
    '6': [
      'Electrical Measurements and Instrumentation',
      'Microprocessors & Microcontrollers',
      'Power System Analysis',
      'Professional Elective – II',
      'Professional Elective – III',
      'Open Elective – II',
      'Electrical Measurements and Instrumentation Lab',
      'Microprocessors & Microcontrollers Lab',
      'IoT Applications of Electrical Engineering Lab'
    ],
    '7': [],
    '8': []
  },

  'Civil Engineering': {
    '1': [
      'Communicative English',
      'Linear Algebra & Calculus',
      'Engineering Physics',
      'Basic Electrical and Electronics Engineering',
      'Engineering Graphics',
      'Communicative English Lab',
      'Engineering Physics Lab',
      'Electrical and Electronics Engineering Workshop',
      'IT Workshop',
      'NSS / NCC / Scouts & Guides / Community Service'
    ],
    '2': [
      'Differential Equations & Vector Calculus',
      'Engineering Chemistry',
      'Introduction to Programming',
      'Basic Civil & Mechanical Engineering',
      'Engineering Mechanics',
      'Engineering Chemistry Lab',
      'Computer Programming Lab',
      'Engineering Workshop',
      'Engineering Mechanics & Building Practices Lab',
      'Health and Wellness, Yoga & Sports'
    ],
    '3': [
      'Numerical Techniques and Statistical Methods',
      'Managerial Economics & Financial Analysis',
      'Surveying',
      'Strength of Materials',
      'Fluid Mechanics',
      'Surveying Lab',
      'Strength of Materials Lab',
      'Building Planning & Drawing',
      'Environmental Science'
    ],
    '4': [
      'Universal Human Values – Understanding Harmony',
      'Engineering Geology',
      'Concrete Technology',
      'Structural Analysis',
      'Hydraulics & Hydraulic Machinery',
      'Concrete Technology Lab',
      'Engineering Geology Lab',
      'Remote Sensing & Geographical Information Systems',
      'Design Thinking & Innovation',
      'Building Materials & Construction'
    ],
    '5': [
      'Concrete and Drawing of Reinforced Concrete Structures',
      'Water Resources Engineering',
      'Geotechnical Engineering',
      'Professional Elective – I',
      'Open Elective – I',
      'Geotechnical Engineering Lab',
      'Fluid Mechanics & Hydraulic Machines Lab',
      'Estimation, Specifications & Contracts',
      'Timbering Lab'
    ],
    '6': [
      'Design and Drawing of Steel Structures',
      'Highway Engineering',
      'Environmental Engineering',
      'Professional Elective – II',
      'Professional Elective – III',
      'Open Elective – II',
      'Environment Engineering Lab',
      'Transportation Engineering Lab',
      'CAD Lab'
    ],
    '7': [],
    '8': []
  },

  'Mechanical Engineering': {
    '1': [
      'Communicative English',
      'Linear Algebra & Calculus',
      'Engineering Physics',
      'Basic Electrical and Electronics Engineering',
      'Engineering Graphics',
      'Communicative English Lab',
      'Engineering Physics Lab',
      'Electrical and Electronics Engineering Workshop',
      'IT Workshop',
      'NSS / NCC / Scouts & Guides / Community Service'
    ],
    '2': [
      'Differential Equations & Vector Calculus',
      'Engineering Chemistry',
      'Introduction to Programming',
      'Basic Civil & Mechanical Engineering',
      'Engineering Mechanics',
      'Engineering Chemistry Lab',
      'Computer Programming Lab',
      'Engineering Workshop',
      'Engineering Mechanics Lab',
      'Health and Wellness, Yoga & Sports'
    ],
    '3': [
      'Numerical Methods & Transform Techniques',
      'Engineering Thermodynamics',
      'Mechanics of Solids',
      'Material Science and Metallurgy',
      'Manufacturing Processes',
      'Fluid Mechanics & Hydraulic Machines',
      'Manufacturing Processes Lab',
      'Mechanics of Solids & Materials Science Lab',
      'Computer-Aided Machine Drawing',
      'Environmental Science'
    ],
    '4': [
      'Complex Variables, Probability & Statistics',
      'Universal Human Values – Understanding Harmony',
      'Industrial Management',
      'Theory of Machines',
      'Applied Thermodynamics – I',
      'Fluid Mechanics & Hydraulic Machines Lab',
      'Structural and Modal Analysis using ANSYS',
      'Soft Skills',
      'Design Thinking & Innovation'
    ],
    '5': [
      'Machine Tools and Metrology',
      'Applied Thermodynamics – II',
      'Design of Machine Elements',
      'Professional Elective – I',
      'Open Elective – I',
      'Thermal Engineering Lab',
      'Machine Tools & Metrology Lab',
      'Theory of Machines Lab',
      'Timbering Lab',
      'Community Service Internship'
    ],
    '6': [
      'Heat Transfer',
      'Applications of AI in Mechanical Engineering',
      'Finite Element Methods',
      'Professional Elective – II',
      'Professional Elective – III',
      'Open Elective – II',
      'Heat Transfer Lab',
      'Robotics and Drone Technologies Lab',
      'Mini Project with IoT and AI Tools',
      'Technical Paper Writing & IPR'
    ],
    '7': [],
    '8': []
  }
};

// Helper function to get subjects for a specific branch and semester
export function getSubjectsForBranchAndSemester(branch: string, semester: string): string[] {
  if (!branch || !semester) return [];
  const branchData = CURRICULUM[branch];
  if (!branchData) return [];
  return branchData[semester] || [];
}

// Helper function to get all unique subjects across all branches and semesters
export function getAllSubjects(): string[] {
  const allSubjects = new Set<string>();
  Object.values(CURRICULUM).forEach(branchData => {
    Object.values(branchData).forEach(subjects => {
      subjects.forEach(subject => allSubjects.add(subject));
    });
  });
  return Array.from(allSubjects).sort();
}

// Short form branch names for display
export const BRANCH_SHORT_NAMES: { [key: string]: string } = {
  'Computer Science & Engineering': 'CSE',
  'Artificial Intelligence & Machine Learning': 'AI & ML',
  'Artificial Intelligence & Data Science': 'AI & DS',
  'Information Technology': 'IT',
  'Electronics & Communication Engineering': 'ECE',
  'Electrical & Electronics Engineering': 'EEE',
  'Civil Engineering': 'CIVIL',
  'Mechanical Engineering': 'MECH'
};

// Reverse mapping: Short name to Full name
export const BRANCH_FULL_NAMES: { [key: string]: string } = {
  'CSE': 'Computer Science & Engineering',
  'AI & ML': 'Artificial Intelligence & Machine Learning',
  'AIML': 'Artificial Intelligence & Machine Learning',
  'AI & DS': 'Artificial Intelligence & Data Science',
  'AIDS': 'Artificial Intelligence & Data Science',
  'IT': 'Information Technology',
  'ECE': 'Electronics & Communication Engineering',
  'EEE': 'Electrical & Electronics Engineering',
  'CIVIL': 'Civil Engineering',
  'MECH': 'Mechanical Engineering'
};

// Get short name for branch
export function getBranchShortName(branch: string): string {
  return BRANCH_SHORT_NAMES[branch] || branch;
}

// Get full name for branch (from short name)
export function getBranchFullName(shortName: string): string {
  return BRANCH_FULL_NAMES[shortName] || shortName;
}
