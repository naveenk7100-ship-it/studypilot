import {
  Conversation,
  ProcessedDocument,
  Flashcard,
  QuizResult,
  ExamPlan,
  LearningState,
  SavedNote
} from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'studypilot_conversations',
  CURRENT_CONV_ID: 'studypilot_active_conv_id',
  DOCUMENTS: 'studypilot_documents',
  FLASHCARDS: 'studypilot_flashcards',
  QUIZ_RESULTS: 'studypilot_quiz_results',
  EXAM_PLANS: 'studypilot_exam_plans',
  LEARNING_STATE: 'studypilot_learning_state',
  SAVED_NOTES: 'studypilot_saved_notes',
  THEME: 'studypilot_theme'
};

// Initial Realistic Demo Data for a rich first-load experience
const INITIAL_DEMO_DATA: {
  conversations: Conversation[];
  documents: ProcessedDocument[];
  flashcards: Flashcard[];
  quizResults: QuizResult[];
  examPlans: ExamPlan[];
  learningState: LearningState;
  savedNotes: SavedNote[];
} = {
  conversations: [
    {
      id: 'conv-demo-1',
      title: 'TCP Congestion Control Deep Dive',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      messages: [
        {
          id: 'm-1',
          role: 'user',
          content: 'Explain TCP congestion control step by step.',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          mode: 'explain',
          difficulty: 'intermediate'
        },
        {
          id: 'm-2',
          role: 'assistant',
          content: `### 1. Simple Explanation
**TCP Congestion Control** is the internet's traffic management protocol. When you send data, your computer probes how much traffic the network can handle, speeds up incrementally, and slows down instantly when routers drop packets.

---

### 2. Why It Matters
Without congestion control, networks suffer from **congestion collapse** where buffers overflow and useful packet delivery drops to zero.

---

### 3. Step-by-Step Explanation
1. **Slow Start**: Begins with $CWND = 1 \\text{ MSS}$. Doubles window every RTT ($1 \\to 2 \\to 4 \\to 8 \\dots$) until reaching $SSTHRESH$.
2. **Congestion Avoidance**: Switched to linear growth ($+1 \\text{ MSS}$ per RTT).
3. **Loss Event**:
   - 3 Duplicate ACKs: $SSTHRESH = CWND / 2$, enter Fast Recovery.
   - Timeout: $SSTHRESH = CWND / 2$, $CWND = 1 \\text{ MSS}$ (Slow Start restarts).
4. **Fast Recovery**: Maintains pipeline flow without dropping to 1 MSS.

---

### 4. Real-World Analogy
Like entering a busy highway ramp: you let cars in progressively, and immediately meter the flow the moment brake lights appear.

---

### 5. Practical Example & Math
$$CWND_{\\text{exponential}} = 2^t \\cdot \\text{MSS}$$
$$CWND_{\\text{linear}}(t+1) = CWND(t) + 1 \\text{ MSS}$$

---

### 6. Key Points to Remember
- **AIMD Principle**: Additive Increase, Multiplicative Decrease.
- **Effective Window**: $\\min(CWND, RWND)$.

---

### 7. Quick Revision Checklist
- [x] Slow start is exponential.
- [x] Congestion avoidance is linear.
- [x] Timeout drops to 1 MSS; 3 Dup ACKs halves window.

---

### 8. Check Your Understanding
> **Quick Question:** If packet loss is detected via 3 Duplicate ACKs at CWND = 24 MSS, what is the new SSTHRESH?
> *(Answer: 12 MSS)*`,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          mode: 'explain',
          difficulty: 'intermediate'
        }
      ]
    }
  ],
  documents: [
    {
      id: 'doc-demo-1',
      fileName: 'Computer_Networks_Chapter_6_Transport_Layer.pdf',
      fileSize: 1024 * 342,
      fileType: 'PDF',
      pageCount: 14,
      uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'processed',
      rawText: 'Transport Layer Protocols and Congestion Management. TCP provides reliable end-to-end transport...',
      pages: [
        { pageNumber: 1, text: 'Chapter 6: Transport Layer Protocols. Introduction to TCP Reno, Tahoe, and Congestion Windows.' },
        { pageNumber: 2, text: 'Slow Start Mechanism. CWND begins at 1 MSS and expands exponentially per ACK.' }
      ],
      summary: 'Comprehensive notes covering TCP Reno, AIMD congestion avoidance, Fast Retransmit, and buffer dynamics.',
      concepts: ['TCP Congestion Control', 'Slow Start', 'Fast Retransmit', 'AIMD', 'Bufferbloat'],
      definitions: [
        { term: 'CWND', definition: 'Congestion Window: the maximum amount of data the sender can transmit without receiving an ACK.' },
        { term: 'SSTHRESH', definition: 'Slow Start Threshold: the boundary at which TCP switches from exponential to linear window growth.' }
      ],
      formulas: ['CWND = min(CWND, RWND)', 'CWND(t+1) = CWND(t) + 1 / CWND'],
      questions: [
        { question: 'What is the mathematical relationship between SSTHRESH and CWND during a loss event?', context: 'Section 6.3' }
      ],
      flashcards: [
        { id: 'fc-d-1', front: 'What causes Congestion Collapse?', back: 'Uncontrolled packet retransmissions filling buffers without forward delivery.', topic: 'Networking' },
        { id: 'fc-d-2', front: 'State the AIMD rule.', back: 'Additive Increase during steady states; Multiplicative Decrease upon packet loss.', topic: 'Networking' }
      ],
      mcqs: [
        {
          id: 'mcq-d-1',
          question: 'What triggers Fast Retransmit in standard TCP Reno?',
          options: ['3 Duplicate ACKs', 'RTO Timeout', 'SYN-ACK Flag', 'FIN Flag'],
          correctAnswer: '3 Duplicate ACKs',
          explanation: '3 Duplicate ACKs indicate an out-of-order segment reached the receiver, prompting immediate retransmission.'
        }
      ],
      chapters: [
        { title: '6.1 Principles of Congestion', estimatedPage: 1, summary: 'Buffer queuing and throughput limits' },
        { title: '6.2 TCP Slow Start & Avoidance', estimatedPage: 4, summary: 'Exponential discovery and linear pacing' },
        { title: '6.3 Loss Recovery Algorithms', estimatedPage: 9, summary: 'Fast Retransmit, Fast Recovery, and SACK' }
      ]
    }
  ],
  flashcards: [
    {
      id: 'fc-1',
      front: 'What is the Slow Start Threshold (SSTHRESH)?',
      back: 'The target CWND limit marking the shift from exponential Slow Start to linear Congestion Avoidance.',
      topic: 'Computer Networks',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      state: 'learning',
      repetitions: 2,
      interval: 3,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString()
    },
    {
      id: 'fc-2',
      front: 'How is CWND adjusted per ACK in Congestion Avoidance?',
      back: 'CWND += 1 / CWND (yielding +1 MSS per Round Trip Time).',
      topic: 'Computer Networks',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      state: 'mastered',
      repetitions: 4,
      interval: 8,
      easeFactor: 2.6,
      nextReviewDate: new Date(Date.now() + 86400000 * 4).toISOString()
    },
    {
      id: 'fc-3',
      front: 'What is the Effective Window formula in TCP?',
      back: 'Effective Window = min(CWND, RWND).',
      topic: 'Computer Networks',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      state: 'new',
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString()
    }
  ],
  quizResults: [
    {
      id: 'res-demo-1',
      quizId: 'quiz-1',
      topic: 'TCP Congestion Control',
      subject: 'Computer Networks',
      difficulty: 'medium',
      totalQuestions: 5,
      score: 4,
      accuracy: 80,
      userAnswers: { 'q-1': 'To start small and probe the network capacity exponentially', 'q-2': 'SSTHRESH is halved and Fast Recovery begins without resetting CWND to 1', 'q-3': 'False', 'q-4': 'Retransmission Timeout (RTO)', 'q-5': 'Automatic Interleaved Message Delivery' },
      questions: [],
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      timeSpentSeconds: 145,
      weakTopics: ['Control Theory / AIMD Definitions']
    }
  ],
  examPlans: [
    {
      id: 'plan-demo-1',
      examName: 'Midterm: Distributed Systems & Networks',
      subject: 'Computer Science',
      examDate: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
      daysRemaining: 6,
      dailyHours: 3,
      totalStudyHours: 18,
      topics: ['OSI & TCP/IP Model', 'Congestion Control', 'Routing Protocols (BGP/OSPF)', 'DNS & HTTP/3', 'Practice Exam'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      dailyPlan: [
        {
          dayNumber: 1,
          title: 'Day 1: OSI & TCP/IP Foundations',
          focusTopic: 'OSI & TCP/IP Model',
          allocatedHours: 3,
          tasks: [
            { id: 't-1-1', text: 'Review Layer 4 vs Layer 3 encapsulation', completed: true },
            { id: 't-1-2', text: 'Solve 10 practice MCQs on Transport headers', completed: true }
          ],
          milestone: 'Protocol Diagnostic'
        },
        {
          dayNumber: 2,
          title: 'Day 2: TCP Congestion Control Mechanics',
          focusTopic: 'Congestion Control',
          allocatedHours: 3,
          tasks: [
            { id: 't-2-1', text: 'Derive Slow Start and Congestion Avoidance curves', completed: true },
            { id: 't-2-2', text: 'Review 8 flashcards on AIMD & Fast Retransmit', completed: false }
          ],
          milestone: 'AIMD Mastery'
        },
        {
          dayNumber: 3,
          title: 'Day 3: Routing Protocols',
          focusTopic: 'Routing Protocols (BGP/OSPF)',
          allocatedHours: 3,
          tasks: [
            { id: 't-3-1', text: 'Compare Link-State vs Distance-Vector algorithms', completed: false },
            { id: 't-3-2', text: 'Trace Dijkstra shortest-path calculations', completed: false }
          ],
          milestone: 'Routing Checkpoint'
        }
      ]
    }
  ],
  learningState: {
    totalStudyMinutes: 215,
    questionsAttempted: 25,
    questionsCorrect: 21,
    streakDays: 4,
    lastActiveDate: new Date().toISOString(),
    topicPerformance: {
      'TCP Congestion Control': {
        attempted: 15,
        correct: 13,
        lastStudied: new Date().toISOString(),
        masteryStatus: 'strong'
      },
      'Routing Protocols': {
        attempted: 10,
        correct: 6,
        lastStudied: new Date(Date.now() - 86400000).toISOString(),
        masteryStatus: 'needs_review'
      }
    },
    weeklyActivity: {
      Mon: 45,
      Tue: 60,
      Wed: 30,
      Thu: 50,
      Fri: 30,
      Sat: 0,
      Sun: 0
    }
  },
  savedNotes: [
    {
      id: 'note-1',
      title: 'AIMD Summary Notes',
      content: 'Additive Increase (+1 MSS/RTT) ensures gentle probe; Multiplicative Decrease (half CWND) ensures rapid relief from congestion.',
      topic: 'Computer Networks',
      savedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ]
};

export const StorageService = {
  // --- Conversations ---
  getConversations(): Conversation[] {
    const val = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!val) {
      this.saveConversations(INITIAL_DEMO_DATA.conversations);
      return INITIAL_DEMO_DATA.conversations as Conversation[];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveConversations(convs: Conversation[]) {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
  },

  getActiveConversationId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONV_ID) || 'conv-demo-1';
  },

  setActiveConversationId(id: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONV_ID, id);
  },

  // --- Documents ---
  getDocuments(): ProcessedDocument[] {
    const val = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!val) {
      this.saveDocuments(INITIAL_DEMO_DATA.documents as ProcessedDocument[]);
      return INITIAL_DEMO_DATA.documents as ProcessedDocument[];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveDocuments(docs: ProcessedDocument[]) {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  },

  addDocument(doc: ProcessedDocument) {
    const docs = this.getDocuments();
    const updated = [doc, ...docs.filter(d => d.id !== doc.id)];
    this.saveDocuments(updated);
  },

  deleteDocument(id: string) {
    const docs = this.getDocuments().filter(d => d.id !== id);
    this.saveDocuments(docs);
  },

  // --- Flashcards ---
  getFlashcards(): Flashcard[] {
    const val = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    if (!val) {
      this.saveFlashcards(INITIAL_DEMO_DATA.flashcards as Flashcard[]);
      return INITIAL_DEMO_DATA.flashcards as Flashcard[];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveFlashcards(cards: Flashcard[]) {
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
  },

  addFlashcards(newCards: Flashcard[]) {
    const cards = this.getFlashcards();
    this.saveFlashcards([...newCards, ...cards]);
  },

  updateFlashcard(card: Flashcard) {
    const cards = this.getFlashcards();
    const index = cards.findIndex(c => c.id === card.id);
    if (index !== -1) {
      cards[index] = card;
      this.saveFlashcards([...cards]);
    }
  },

  deleteFlashcard(id: string) {
    const cards = this.getFlashcards().filter(c => c.id !== id);
    this.saveFlashcards(cards);
  },

  // --- Quiz Results ---
  getQuizResults(): QuizResult[] {
    const val = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
    if (!val) {
      this.saveQuizResults(INITIAL_DEMO_DATA.quizResults as QuizResult[]);
      return INITIAL_DEMO_DATA.quizResults as QuizResult[];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveQuizResults(results: QuizResult[]) {
    localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(results));
  },

  addQuizResult(result: QuizResult) {
    const results = this.getQuizResults();
    this.saveQuizResults([result, ...results]);
    this.recordQuizInLearningState(result);
  },

  // --- Exam Plans ---
  getExamPlans(): ExamPlan[] {
    const val = localStorage.getItem(STORAGE_KEYS.EXAM_PLANS);
    if (!val) {
      this.saveExamPlans(INITIAL_DEMO_DATA.examPlans as ExamPlan[]);
      return INITIAL_DEMO_DATA.examPlans as ExamPlan[];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveExamPlans(plans: ExamPlan[]) {
    localStorage.setItem(STORAGE_KEYS.EXAM_PLANS, JSON.stringify(plans));
  },

  addExamPlan(plan: ExamPlan) {
    const plans = this.getExamPlans();
    this.saveExamPlans([plan, ...plans]);
  },

  updateExamPlan(plan: ExamPlan) {
    const plans = this.getExamPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    if (index !== -1) {
      plans[index] = plan;
      this.saveExamPlans([...plans]);
    }
  },

  deleteExamPlan(id: string) {
    const plans = this.getExamPlans().filter(p => p.id !== id);
    this.saveExamPlans(plans);
  },

  // --- Learning State & Progress ---
  getLearningState(): LearningState {
    const val = localStorage.getItem(STORAGE_KEYS.LEARNING_STATE);
    if (!val) {
      this.saveLearningState(INITIAL_DEMO_DATA.learningState as LearningState);
      return INITIAL_DEMO_DATA.learningState as LearningState;
    }
    try {
      return JSON.parse(val);
    } catch {
      return INITIAL_DEMO_DATA.learningState as LearningState;
    }
  },

  saveLearningState(state: LearningState) {
    localStorage.setItem(STORAGE_KEYS.LEARNING_STATE, JSON.stringify(state));
  },

  recordStudyTime(minutes: number) {
    const state = this.getLearningState();
    state.totalStudyMinutes += minutes;
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    if (state.weeklyActivity[dayName] !== undefined) {
      state.weeklyActivity[dayName] += minutes;
    } else {
      state.weeklyActivity[dayName] = minutes;
    }
    state.lastActiveDate = new Date().toISOString();
    this.saveLearningState(state);
  },

  recordQuizInLearningState(result: QuizResult) {
    const state = this.getLearningState();
    state.questionsAttempted += result.totalQuestions;
    state.questionsCorrect += result.score;
    state.totalStudyMinutes += Math.round(result.timeSpentSeconds / 60) || 5;

    const topic = result.topic || 'General';
    const current = state.topicPerformance[topic] || {
      attempted: 0,
      correct: 0,
      lastStudied: new Date().toISOString(),
      masteryStatus: 'learning'
    };

    current.attempted += result.totalQuestions;
    current.correct += result.score;
    current.lastStudied = new Date().toISOString();

    const acc = current.correct / current.attempted;
    if (acc >= 0.8 && current.attempted >= 5) {
      current.masteryStatus = 'strong';
    } else if (acc < 0.6) {
      current.masteryStatus = 'needs_review';
    } else {
      current.masteryStatus = 'learning';
    }

    state.topicPerformance[topic] = current;
    this.saveLearningState(state);
  },

  // --- Saved Notes ---
  getSavedNotes(): SavedNote[] {
    const val = localStorage.getItem(STORAGE_KEYS.SAVED_NOTES);
    if (!val) {
      this.saveSavedNotes(INITIAL_DEMO_DATA.savedNotes as SavedNote[]);
      return INITIAL_DEMO_DATA.savedNotes as SavedNote[];
    }
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },

  saveSavedNotes(notes: SavedNote[]) {
    localStorage.setItem(STORAGE_KEYS.SAVED_NOTES, JSON.stringify(notes));
  },

  addSavedNote(note: SavedNote) {
    const notes = this.getSavedNotes();
    this.saveSavedNotes([note, ...notes]);
  },

  deleteSavedNote(id: string) {
    const notes = this.getSavedNotes().filter(n => n.id !== id);
    this.saveSavedNotes(notes);
  },

  // --- Privacy & Data Management Controls ---
  clearChatHistory() {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CONV_ID);
  },

  deleteSavedMaterial() {
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.SAVED_NOTES);
  },

  deleteAllStudyData() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  },

  exportAllData(): string {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      conversations: this.getConversations(),
      documents: this.getDocuments(),
      flashcards: this.getFlashcards(),
      quizResults: this.getQuizResults(),
      examPlans: this.getExamPlans(),
      learningState: this.getLearningState(),
      savedNotes: this.getSavedNotes()
    };
    return JSON.stringify(fullBackup, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.conversations) this.saveConversations(data.conversations);
      if (data.documents) this.saveDocuments(data.documents);
      if (data.flashcards) this.saveFlashcards(data.flashcards);
      if (data.quizResults) this.saveQuizResults(data.quizResults);
      if (data.examPlans) this.saveExamPlans(data.examPlans);
      if (data.learningState) this.saveLearningState(data.learningState);
      if (data.savedNotes) this.saveSavedNotes(data.savedNotes);
      return true;
    } catch (e) {
      console.error('Failed to import backup data:', e);
      return false;
    }
  }
};
