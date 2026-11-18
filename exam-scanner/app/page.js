
'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, ArrowLeft, Scan, Users, FileText, BarChart3, Type, Hash, Grid3x3, Lock } from 'lucide-react';
import { ScanEngine } from './services/scanEngine';
import { setScoringRule } from './services/scoringEngine';

// applyPostExamRule 和评分规则的按钮应在组件内部声明使用。


const ExamScannerSystem = () => {
  const [view, setView] = useState('list');
  const [scoringRules, setScoringRules] = useState({});
  const [templates, setTemplates] = useState([]);
  // 当前正在编辑的模板
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    subject: '',
    subjectCode: '',
    // 新增：考届（如 2025）
    examSession: '',
    // 新增：考场编号
    centreCode: '',
    // 新增：人数（缺席卡用）
    numStudents: 0,
    questionCount: 30,
    optionType: 'ABCD',
    answers: [],
    templateType: 'choice' // 模板类型：choice/essay/absence/final
  });
  // 用于在答题卡中摆放组件的数据
  const [components, setComponents] = useState([]);
  // 当前选中的组件，用于属性编辑
  const [selected, setSelected] = useState(null);
  // 顶部标签：答题卡模板/扫描仪模块
  const [tab, setTab] = useState('templates');
  // 扫描仪连接状态和扫描结果列表，试验阶段默认已连接
  const [scannerConnected, setScannerConnected] = useState(true);
  // 扫描结果列表，支持批量扫描
  const [scanResults, setScanResults] = useState([]);
  // 当前扫描使用的模板 ID（用来判分）
  const [selectedScanTemplateId, setSelectedScanTemplateId] = useState(null);
  // 保存后的模板，用于保存后总预览
  const [savedTemplate, setSavedTemplate] = useState(null);
  const engineRef = React.useRef(null);

useEffect(() => {
  engineRef.current = new ScanEngine({
    A: ['A', 'B', 'C', 'D']
  });
}, []);

  // 导出扫描结果为 CSV 文件
  const exportResults = () => {
    if (!scanResults || scanResults.length === 0) return;
    let csv = '';
    // CSV header
    csv += [
      translations.en.exam_id_label,
      translations.en.name_label,
      translations.en.subject_label,
      translations.en.question_count_result_label,
      translations.en.correct_count_label,
      translations.en.score_label,
      translations.en.answer_preview_label
    ].join(',') + '\n';
    scanResults.forEach(res => {
      const row = [
        res.examId || '',
        res.name || '',
        res.subject || '',
        res.questionCount,
        res.correctCount,
        res.score,
        (res.answers || []).join(' ')
      ];
      csv += row.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'scan_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 搜索关键词，用于过滤模板
  const [searchTerm, setSearchTerm] = useState('');

  // 创建模板时选择模板类型的弹窗显示状态
  const [showTypeSelection, setShowTypeSelection] = useState(false);

  // 拖拽相关：当前正在拖拽的组件ID和偏移量
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  // 设计区域的引用，用于计算鼠标相对位置
  const designAreaRef = React.useRef(null);

  // 语言状态：zh = 中文，en = English
  const [language, setLanguage] = useState('zh');

  // =============== 新增：辅助设计功能状态 ===============
  // 是否开启网格对齐和显示
  const [gridEnabled, setGridEnabled] = useState(true);
  // 是否显示标尺
  const [showRulers, setShowRulers] = useState(true);
  // 画布缩放比例
  const [zoom, setZoom] = useState(1);
  // 网格间距（单位：像素，以未缩放坐标为基准）
  const gridSpacing = 20;
  // 文本翻译字典
  const translations = {
    zh: {
      title_main: '考试答题卡扫描系统',
      tab_templates: '答题卡模板',
      tab_scanner: '扫描仪模块',
      create_template: '创建新模板',
      template_list_title: '答题卡模板',
      total_templates: '总数',
      matched_templates: '匹配',
      search_placeholder: '搜索模板名称、学科或编号...',
      no_templates: '暂无模板或无匹配结果',
      template_name_label: '模板名称',
      subject_label: '学科',
      subject_code_label: '学科编号',
      question_count_label: '题目数量 (1-150)',
      option_type_label: '选项类型',
      design_answer_sheet: '设计答题卡',
      next: '下一步 →',
      back: '返回',
      delete: '删除',
      component_library: '组件库',
      properties: '属性',
      gap_label: '间距',
      shape_label: '形状',
      size_label: '大小',
      font_size_label: '字体大小',
      font_label: '字体',
      circle: '圆形',
      ellipse: '椭圆形',
      roundRect: '圆角矩形',
      add_component_hint: '拖拽组件到这里',
      answers_area_title: '答 案',
      set_answers_title: '设置标准答案',
      preview_button: '预览',
      save: '保存',
      save_template: '保存模板',
      answer_preview_title: '答题卡预览',
      total_preview_title: '模板保存成功！总预览',
      template_info_label_name: '模板名称',
      template_info_label_subject: '学科',
      template_info_label_subject_code: '学科编号',
      template_info_label_qcount: '题目数量',
      template_info_label_option_type: '选项类型',
      return_to_list: '返回模板列表',
      view_preview: '查看预览',
      edit_answers: '更改标准答案',
      scan_module_title: '扫描仪模块',
      status_label: '状态',
      connected: '已连接',
      disconnected: '未连接',
      connect_scanner_button: '连接扫描仪',
      disconnect_scanner_button: '断开连接',
      scan_sheet_button: '扫描答题卡',
      steps_title: '操作步骤：',
      step1: '如需连接扫描仪，请点击上方“连接扫描仪”按钮。',
      step2: '将答题卡平整放置在扫描仪玻璃板上。',
      step3: '点击“扫描答题卡”以开始扫描并识别答题卡内容。',
      step4: '系统解析完成后，将在下方展示扫描结果。',
      scan_results_title: '扫描结果',
      scan_results_title_with_index: '扫描结果 {n}',
      exam_id_label: '考试编号',
      name_label: '姓名',
      correct_count_label: '正确题数',
      score_label: '得分',
      answer_preview_label: '答案预览',
      export_results_button: '导出结果',
      language_label: '语言',
      chinese_language: '中文',
      english_language: 'English',
      bonus_all: 'Bonus (全对)',
      answers_label: '答案'
      ,
      // 新增标签，用于模板列表的题目和选项字段
      questions_label: '题目',
      options_label: '选项',
      // 扫描结果中用于显示题目数量的标签
      question_count_result_label: '题目数量'

      ,
      // 属性面板提示
      click_to_view_props: '点击组件查看属性',
      // 确认删除
      delete_confirm: '确定删除?',
      // 返回设计器时提示会丢失更改
      confirm_discard_changes: '返回将丢失更改，确定?'
      ,
      // 扫描模块选择模板
      select_scan_template_label: '选择模板',
      no_template_available: '暂无模板，请先创建模板'

      ,
      // 新增：模板类型相关
      select_template_type: '选择模板类型',
      template_type_choice: '选择题答题卡',
      template_type_essay: '作答题卡',
      template_type_absence: '缺席卡',
      template_type_final: '终卡',
      template_type_label: '模板类型',
      essay_area_name: '作答区'
      ,
      // 当模板无需设置标准答案时的提示
      no_answers_for_template: '此模板无需设置标准答案'
      ,
      // 缺考卡新增标签
      exam_session_label: '考届',
      centre_code_label: '考场编号',
      num_students_label: '人数',
      absence_area_title: '缺 席'
    },
    en: {
      title_main: 'Exam Answer Sheet Scanner System',
      tab_templates: 'Templates',
      tab_scanner: 'Scanner Module',
      create_template: 'Create New Template',
      template_list_title: 'Templates',
      total_templates: 'Total',
      matched_templates: 'Matched',
      search_placeholder: 'Search template name, subject or code...',
      no_templates: 'No templates or no matching results',
      template_name_label: 'Template Name',
      subject_label: 'Subject',
      subject_code_label: 'Subject Code',
      question_count_label: 'Question Count (1-150)',
      option_type_label: 'Option Type',
      design_answer_sheet: 'Design Answer Sheet',
      next: 'Next →',
      back: 'Back',
      delete: 'Delete',
      component_library: 'Component Library',
      properties: 'Properties',
      gap_label: 'Gap',
      shape_label: 'Shape',
      size_label: 'Size',
      font_size_label: 'Font Size',
      font_label: 'Font',
      circle: 'Circle',
      ellipse: 'Ellipse',
      roundRect: 'Rounded Rectangle',
      add_component_hint: 'Drag components here',
      answers_area_title: 'Answers',
      set_answers_title: 'Set Standard Answers',
      preview_button: 'Preview',
      save: 'Save',
      save_template: 'Save Template',
      answer_preview_title: 'Answer Sheet Preview',
      total_preview_title: 'Template Saved! Summary Preview',
      template_info_label_name: 'Template Name',
      template_info_label_subject: 'Subject',
      template_info_label_subject_code: 'Subject Code',
      template_info_label_qcount: 'Question Count',
      template_info_label_option_type: 'Option Type',
      return_to_list: 'Return to Template List',
      view_preview: 'View Preview',
      edit_answers: 'Edit Answers',
      scan_module_title: 'Scanner Module',
      status_label: 'Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connect_scanner_button: 'Connect Scanner',
      disconnect_scanner_button: 'Disconnect',
      scan_sheet_button: 'Scan Answer Sheet',
      steps_title: 'Steps:',
      step1: 'To connect the scanner, click “Connect Scanner” above.',
      step2: 'Place the answer sheet flat on the scanner glass.',
      step3: 'Click “Scan Answer Sheet” to start scanning and recognize the answer sheet.',
      step4: 'The results will be displayed below after processing.',
      scan_results_title: 'Scan Result',
      scan_results_title_with_index: 'Scan Result {n}',
      exam_id_label: 'Exam ID',
      name_label: 'Name',
      correct_count_label: 'Correct Count',
      score_label: 'Score',
      answer_preview_label: 'Answer Preview',
      export_results_button: 'Export Results',
      language_label: 'Language',
      chinese_language: '中文',
      english_language: 'English',
      bonus_all: 'Bonus (All correct)',
      answers_label: 'Answers'
      ,
      // New labels for template card fields
      questions_label: 'Questions',
      options_label: 'Options',
      // Label for question count in scan result
      question_count_result_label: 'Question Count'

      ,
      // Property panel hint
      click_to_view_props: 'Click component to view properties',
      // Delete confirmation
      delete_confirm: 'Are you sure to delete?',
      // Discard changes confirmation
      confirm_discard_changes: 'Returning will discard changes. Continue?'
      ,
      // Select template in scanner
      select_scan_template_label: 'Select Template',
      no_template_available: 'No templates available, please create one first'

      ,
      // Added: template type related
      select_template_type: 'Select Template Type',
      template_type_choice: 'Choice Answer Card',
      template_type_essay: 'Essay Answer Card',
      template_type_absence: 'Absence Card',
      template_type_final: 'Final Card',
      template_type_label: 'Template Type',
      essay_area_name: 'Essay Area'
      ,
      // When a template has no standard answers to set
      no_answers_for_template: 'No standard answers required for this template'
      ,
      // Labels for absence card
      exam_session_label: 'Exam Session',
      centre_code_label: 'Centre Code',
      num_students_label: 'Number of Students',
      absence_area_title: 'Absence'
    }
  };
  // 翻译函数
  const t = (key, replace = {}) => {
    let text = translations[language][key] || key;
    Object.keys(replace).forEach(k => {
      text = text.replace(`{${k}}`, replace[k]);
    });
    return text;
  };

  // 本次试验阶段不检测扫描仪，手动连接/断开

  // 执行扫描答题卡
  const handleScan = async () => {
    if (!scannerConnected) {
      alert('未连接扫描仪，请连接扫描仪后再进行扫描');
      return;
    }
    const scanned = await scanAnswerSheet();
    // 将扫描结果添加到列表
    setScanResults(prev => [...prev, scanned]);
  };

  // 模拟扫描过程，返回假数据
  const scanAnswerSheet = async () => {
  const engine = engineRef.current;

  // 🔴 第一张：一定出错
  // 🟢 第二张：正常
  const mockCard = {
    paper_version: 'A',
    image: {
      mockAnswers:
        scanResults.length === 0
          ? ['A', ['B', 'C'], 'D', null]   // ❌ MULTIPLE + BLANK
          : ['A', 'B', 'C', 'D']           // ✅ OK
    }
  };

  const result = engine.scan(mockCard);

  // ⭐ PDF 关键逻辑：立即停 + 弹窗
  if (result.status === 'EXCEPTION') {
    alert(
      '扫描异常：\n' +
      result.detail.exceptions
        .map(e => `第 ${e.q} 题：${e.type}`)
        .join('\n')
    );

    return {
      examId: Date.now().toString(),
      name: '异常考生',
      subject: currentTemplate.subject,
      questionCount: currentTemplate.questionCount,
      correctCount: 0,
      score: 'NEED REVIEW',
      answers: []
    };
  }

  return {
    examId: Date.now().toString(),
    name: '正常考生',
    subject: currentTemplate.subject,
    questionCount: currentTemplate.questionCount,
    correctCount: result.result.correctCount,
    score: result.result.score,
    answers: mockCard.image.mockAnswers
  };
};

  const componentTypes = [
    { id: 'title', name: '考试标题', icon: Type, text: '2025年马来西亚华文独中统一考试', w: 700, h: 40 },
    { id: 'subtitle', name: '答案纸标题', icon: Type, text: 'KERTAS JAWAPAN / ANSWER SHEET "O"', w: 700, h: 30 },
    { id: 'confidential', name: '机密', icon: Lock, text: '机密', w: 80, h: 30 },
    { id: 'studentId', name: '考生编号', icon: Hash, label: '考生编号:', w: 250, h: 50 },
    { id: 'studentName', name: '考生姓名', icon: Type, label: '考生姓名:', w: 250, h: 50 },
    { id: 'school', name: '学校', icon: Users, label: '学 校:', w: 250, h: 50 },
    { id: 'subject', name: '学科', icon: FileText, label: '学 科:', w: 200, h: 50 },
    { id: 'subjectCode', name: '学科编号', icon: Grid3x3, label: '学科编号', w: 300, h: 80 },
    { id: 'answerGrid', name: '答案区', icon: Grid3x3, w: 700, h: 700 }
    ,
    // 新增：作答区，用于作文或主观题
    { id: 'essayArea', name: '作答区', icon: FileText, w: 700, h: 700 }
    ,
    // 新增：考试信息组件
    { id: 'examSession', name: '考届', icon: Type, label: '考届:', w: 200, h: 50 },
    { id: 'centreCode', name: '考场编号', icon: Type, label: '考场编号:', w: 200, h: 50 },
    { id: 'numStudents', name: '人数', icon: Type, label: '人 数:', w: 200, h: 50 },
    // 缺席人数标记区域
    { id: 'absenceGrid', name: '缺席区域', icon: Grid3x3, w: 700, h: 300 }
  ];

  const calculateLayout = (total) => {
    if (total <= 10) return { columns: 1, per: 10 };
    if (total <= 20) return { columns: 2, per: 10 };
    if (total <= 30) return { columns: 3, per: 10 };
    if (total <= 40) return { columns: 4, per: 10 };
    if (total <= 50) return { columns: 5, per: 10 };
    if (total <= 60) return { columns: 4, per: 15 };
    if (total <= 80) return { columns: 4, per: 20 };
    if (total <= 100) return { columns: 5, per: 20 };
    if (total <= 120) return { columns: 6, per: 20 };
    return { columns: 6, per: 25 };
  };

  const startCreate = (type = 'choice') => {
    // 根据模板类型设置默认配置
    let questionCount;
    let optionType;
    let answers;
    let initialComponents;
    const baseInfo = {
      name: '',
      subject: '',
      subjectCode: '',
      templateType: type
    };
    if (type === 'choice') {
      questionCount = 30;
      optionType = 'ABCD';
      answers = Array(questionCount).fill('');
      // 选择题模板包含答案区（answerGrid）
      initialComponents = [
        { id: 1, type: 'title', x: 50, y: 20, w: 650, h: 40, fontSize: 16, fontFamily: 'SimSun' },
        { id: 2, type: 'confidential', x: 700, y: 20, w: 60, h: 30, fontSize: 12, fontFamily: 'SimSun' },
        { id: 3, type: 'subtitle', x: 50, y: 70, w: 700, h: 30, fontSize: 14, fontFamily: 'SimSun' },
        { id: 4, type: 'studentId', x: 50, y: 120, w: 230, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 5, type: 'studentName', x: 300, y: 120, w: 230, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 6, type: 'subject', x: 550, y: 120, w: 200, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 7, type: 'subjectCode', x: 50, y: 190, w: 300, h: 80, fontSize: 12, fontFamily: 'SimSun' },
        { id: 8, type: 'answerGrid', x: 50, y: 290, w: 700, h: 700, gap: 6, shape: 'circle', size: 16 }
      ];
    } else if (type === 'essay') {
      // 作答题卡默认 5 题（可调整），但无客观选项
      questionCount = 5;
      optionType = '';
      answers = Array(questionCount).fill('');
      initialComponents = [
        { id: 1, type: 'title', x: 50, y: 20, w: 650, h: 40, fontSize: 16, fontFamily: 'SimSun' },
        { id: 2, type: 'confidential', x: 700, y: 20, w: 60, h: 30, fontSize: 12, fontFamily: 'SimSun' },
        { id: 3, type: 'subtitle', x: 50, y: 70, w: 700, h: 30, fontSize: 14, fontFamily: 'SimSun' },
        { id: 4, type: 'studentId', x: 50, y: 120, w: 230, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 5, type: 'studentName', x: 300, y: 120, w: 230, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 6, type: 'subject', x: 550, y: 120, w: 200, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 7, type: 'subjectCode', x: 50, y: 190, w: 300, h: 80, fontSize: 12, fontFamily: 'SimSun' },
        { id: 8, type: 'essayArea', x: 50, y: 290, w: 700, h: 700, gap: 6 }
      ];
    } else if (type === 'absence') {
      // 缺席卡：记录缺考学生编号，包含考试信息和缺席区域
      questionCount = 0;
      optionType = '';
      answers = [];
      // 默认缺席人数（可由用户在表单修改）
      const defaultNumStudents = 50;
      initialComponents = [
        { id: 1, type: 'title', x: 50, y: 20, w: 650, h: 40, fontSize: 16, fontFamily: 'SimSun' },
        { id: 2, type: 'confidential', x: 700, y: 20, w: 60, h: 30, fontSize: 12, fontFamily: 'SimSun' },
        { id: 3, type: 'subtitle', x: 50, y: 70, w: 700, h: 30, fontSize: 14, fontFamily: 'SimSun' },
        // 学科信息
        { id: 4, type: 'subject', x: 50, y: 120, w: 200, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 5, type: 'subjectCode', x: 270, y: 120, w: 280, h: 80, fontSize: 12, fontFamily: 'SimSun' },
        // 考届与考场
        { id: 6, type: 'examSession', x: 570, y: 120, w: 200, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 7, type: 'centreCode', x: 50, y: 210, w: 200, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        // 人数
        { id: 8, type: 'numStudents', x: 270, y: 210, w: 200, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        // 缺席标记区域
        { id: 9, type: 'absenceGrid', x: 50, y: 280, w: 700, h: 700, gap: 6, shape: 'circle', size: 16 }
      ];
      // 初始化缺席卡特有字段
      baseInfo.numStudents = defaultNumStudents;
      baseInfo.examSession = '';
      baseInfo.centreCode = '';
    } else {
      // 终卡：无答题区，问题数量为 0
      questionCount = 0;
      optionType = '';
      answers = [];
      initialComponents = [
        { id: 1, type: 'title', x: 50, y: 20, w: 650, h: 40, fontSize: 16, fontFamily: 'SimSun' },
        { id: 2, type: 'confidential', x: 700, y: 20, w: 60, h: 30, fontSize: 12, fontFamily: 'SimSun' },
        { id: 3, type: 'subtitle', x: 50, y: 70, w: 700, h: 30, fontSize: 14, fontFamily: 'SimSun' },
        { id: 4, type: 'studentId', x: 50, y: 120, w: 230, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 5, type: 'studentName', x: 300, y: 120, w: 230, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 6, type: 'subject', x: 550, y: 120, w: 200, h: 50, fontSize: 12, fontFamily: 'SimSun' },
        { id: 7, type: 'subjectCode', x: 50, y: 190, w: 300, h: 80, fontSize: 12, fontFamily: 'SimSun' }
      ];
    }
    // 更新模板信息
    setCurrentTemplate({
      ...baseInfo,
      questionCount,
      optionType,
      answers,
      // 确保缺席卡字段存在，若 baseInfo 中未提供则设为默认值
      examSession: baseInfo.examSession || '',
      centreCode: baseInfo.centreCode || '',
      numStudents: baseInfo.numStudents || 0
    });
    // 设置初始组件列表
    setComponents(initialComponents);
    setSelected(null);
    setView('designer');
  };

  const goToAnswers = () => {
    if (!currentTemplate.name || !currentTemplate.subject || !currentTemplate.subjectCode) {
      alert('请填写模板名称、学科和学科编号');
      return;
    }
    setView('answers');
  };

  const saveTemplate = () => {
    // 根据是否已有 ID 判断是新建还是更新
    let updatedTemplate;
    if (currentTemplate.id) {
      // 更新已有模板：替换对应 ID 的模板
      updatedTemplate = { ...currentTemplate, layout: components };
      setTemplates(templates.map(t => (t.id === currentTemplate.id ? updatedTemplate : t)));
    } else {
      // 创建新的模板对象，包含布局和新 ID
      updatedTemplate = { ...currentTemplate, id: Date.now(), layout: components };
      setTemplates([...templates, updatedTemplate]);
    }
    // 保存更新后的模板供总预览使用
    setSavedTemplate(updatedTemplate);
    // 进入总预览界面
    setView('summary');
    alert('✅ 模板保存成功！');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (!type) return;
    const comp = componentTypes.find(c => c.id === type);
    const rect = e.currentTarget.getBoundingClientRect();
    // 设计区域尺寸
    const designWidth = 794;
    const designHeight = 1123;
    // 计算未缩放坐标
    let x = (e.clientX - rect.left) / zoom - 50;
    let y = (e.clientY - rect.top) / zoom - 25;
    // 网格对齐
    if (gridEnabled) {
      x = Math.round(x / gridSpacing) * gridSpacing;
      y = Math.round(y / gridSpacing) * gridSpacing;
    }
    // 限制在设计区域范围内
    x = Math.max(0, Math.min(designWidth - comp.w, x));
    y = Math.max(0, Math.min(designHeight - comp.h, y));
    // 新增组件时，根据类型设置默认属性
    const base = {
      id: Date.now(),
      type,
      x,
      y,
      w: comp.w,
      h: comp.h
    };
    if (type === 'answerGrid') {
      base.gap = 6;
      base.shape = 'circle';
      base.size = 16;
    } else if (type === 'absenceGrid') {
      // 缺席区域默认样式
      base.gap = 6;
      base.shape = 'circle';
      base.size = 16;
    } else {
      // 根据组件类型选择默认字体大小
      base.fontSize = type === 'title' ? 16 : (type === 'subtitle' ? 14 : 12);
      // 默认字体
      base.fontFamily = 'SimSun';
    }
    setComponents([...components, base]);
  };

  const updateProp = (prop, val) => {
    if (!selected) return;
    // 处理字符串属性，如字体和形状
    if (prop === 'fontFamily' || prop === 'shape') {
      setComponents(
        components.map(c => (c.id === selected.id ? { ...c, [prop]: val } : c))
      );
      setSelected({ ...selected, [prop]: val });
      return;
    }
    // 数值属性：大小、间距、位置、尺寸等
    const num = parseInt(val) || 0;
    setComponents(
      components.map(c => (c.id === selected.id ? { ...c, [prop]: num } : c))
    );
    setSelected({ ...selected, [prop]: num });
  };

  const renderComp = (c) => {
    const def = componentTypes.find(t => t.id === c.type);
    const sel = selected?.id === c.id;
    const isDraggingComp = draggingId === c.id;
    const base = {
      position: 'absolute',
      left: c.x,
      top: c.y,
      width: c.w,
      height: c.h,
      border: sel ? '3px solid #4F46E5' : '1px solid #D1D5DB',
      background: 'white',
      padding: 8,
      cursor: 'pointer',
      boxSizing: 'border-box',
      // 拖拽时半透明预览
      opacity: isDraggingComp ? 0.5 : 1
    };

    if (c.type === 'answerGrid') {
      const { columns, per } = calculateLayout(currentTemplate.questionCount);
      const opts = currentTemplate.optionType.split('');
      return (
        <div key={c.id} style={base} onMouseDown={(e) => onComponentMouseDown(e, c)}>
          <div style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#000' }}>答 案</div>
          <div style={{ display: 'flex', gap: c.gap || 6, justifyContent: 'center' }}>
            {Array.from({ length: columns }).map((_, col) => {
              const start = col * per;
              const end = Math.min(start + per, currentTemplate.questionCount);
              return (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.from({ length: end - start }).map((_, row) => {
                    const q = start + row;
                    const ans = currentTemplate.answers[q];
                    return (
                      <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                        <span style={{ width: 18, textAlign: 'right', fontWeight: 'bold', color: '#000' }}>{q + 1}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {opts.map(o => {
                            // Bonus 情况：当答案为 ALL 时，所有选项都视为选中
                            const isSelected = ans === 'ALL' || ans === o;
                            // 根据形状和大小计算样式
                            const shape = c.shape || 'circle';
                            const size = c.size || 16;
                            let width = size;
                            let height = size;
                            let borderRadius = '50%';
                            if (shape === 'ellipse') {
                              width = size * 1.5;
                              height = size;
                              borderRadius = '50%';
                            } else if (shape === 'roundRect') {
                              width = size * 1.8;
                              height = size;
                              borderRadius = size * 0.3;
                            }
                            const fontSize = Math.max(9, Math.floor(size * 0.6));
                            return (
                              <div
                                key={o}
                                style={{
                                  width,
                                  height,
                                  border: '2px solid #333',
                                  borderRadius,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize,
                                  fontWeight: 'bold',
                                  background: isSelected ? '#333' : 'white',
                                  color: isSelected ? 'white' : '#999'
                                }}
                              >
                                {o}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 作答区：显示主观题答题区域（若模板类型为 essay）
    if (c.type === 'essayArea') {
      const { columns, per } = calculateLayout(currentTemplate.questionCount);
      return (
        <div key={c.id} style={base} onMouseDown={(e) => onComponentMouseDown(e, c)}>
          <div
            style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#000' }}
          >
            {t('essay_area_name')}
          </div>
          <div style={{ display: 'flex', gap: c.gap || 6, justifyContent: 'center' }}>
            {Array.from({ length: columns }).map((_, col) => {
              const start = col * per;
              const end = Math.min(start + per, currentTemplate.questionCount);
              return (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Array.from({ length: end - start }).map((_, row) => {
                    const q = start + row;
                    return (
                      <div key={q} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 10 }}>
                        <span
                          style={{ width: 18, textAlign: 'right', fontWeight: 'bold', color: '#000', paddingTop: 4 }}
                        >
                          {q + 1}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {[1, 2, 3].map(line => (
                            <div
                              key={line}
                              style={{ width: 180, height: 12, borderBottom: '1px solid #333' }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 缺席标记区：显示缺席学生的编号和圆圈
    if (c.type === 'absenceGrid') {
      const total = currentTemplate.numStudents || 0;
      const { columns, per } = calculateLayout(total);
      const header = t('absence_area_title');
      return (
        <div key={c.id} style={base} onMouseDown={(e) => onComponentMouseDown(e, c)}>
          <div style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#000' }}>{header}</div>
          <div style={{ display: 'flex', gap: c.gap || 6, justifyContent: 'center' }}>
            {Array.from({ length: columns }).map((_, col) => {
              const start = col * per;
              const end = Math.min(start + per, total);
              return (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.from({ length: end - start }).map((_, row) => {
                    const q = start + row;
                    return (
                      <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                        <span style={{ width: 18, textAlign: 'right', fontWeight: 'bold', color: '#000' }}>{q + 1}</span>
                        <div style={{ width: c.size || 16, height: c.size || 16, border: '2px solid #333', borderRadius: '50%' }}></div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (c.type === 'title' || c.type === 'subtitle' || c.type === 'confidential') {
      return (
        <div
          key={c.id}
          style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseDown={(e) => onComponentMouseDown(e, c)}
        >
          <span
            style={{
              fontWeight: 'bold',
              fontSize:
                c.fontSize || (c.type === 'title' ? 16 : c.type === 'subtitle' ? 14 : 12),
              color: '#000',
              fontFamily: c.fontFamily || 'SimSun'
            }}
          >
            {def.text}
          </span>
        </div>
      );
    }

    if (def.label) {
      return (
        <div key={c.id} style={base} onMouseDown={(e) => onComponentMouseDown(e, c)}>
          <div
            style={{
              fontSize: c.fontSize || 11,
              fontWeight: 'bold',
              marginBottom: 4,
              color: '#000',
              fontFamily: c.fontFamily || 'SimSun'
            }}
          >
            {def.label}
          </div>
          <div style={{ borderBottom: '2px solid #333', height: 20 }}></div>
        </div>
      );
    }

    if (c.type === 'subjectCode') {
      return (
        <div
          key={c.id}
          style={{ ...base, border: '2px solid #333' }}
          onMouseDown={(e) => onComponentMouseDown(e, c)}
        >
          <div
            style={{
              fontSize: c.fontSize || 11,
              fontWeight: 'bold',
              marginBottom: 6,
              color: '#000',
              fontFamily: c.fontFamily || 'SimSun'
            }}
          >
            学科编号: {currentTemplate.subjectCode}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {['V', 'Y', 'D'].map(code => (
              <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>{code}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <div
                      key={n}
                      style={{ width: 10, height: 10, border: '1px solid #333', borderRadius: '50%' }}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  // 当鼠标按下组件时，开始拖拽并选中组件
  const onComponentMouseDown = (e, comp) => {
    // 只处理左键拖拽
    if (e.button !== 0) return;
    // 选中组件
    setSelected(comp);
    if (designAreaRef.current) {
      const rect = designAreaRef.current.getBoundingClientRect();
      setDragOffset({ dx: e.clientX - rect.left - comp.x, dy: e.clientY - rect.top - comp.y });
      setDraggingId(comp.id);
    }
  };

  // 根据保存后的模板渲染组件，用于总预览
  const renderSavedComp = (c) => {
    const def = componentTypes.find(t => t.id === c.type);
    const base = {
      position: 'absolute',
      left: c.x,
      top: c.y,
      width: c.w,
      height: c.h,
      border: '1px solid #D1D5DB',
      background: 'white',
      padding: 8,
      boxSizing: 'border-box'
    };
    // 答案区：显示保存模板的答案，并用黑圈标识
    if (c.type === 'answerGrid') {
      const { columns, per } = calculateLayout(savedTemplate.questionCount);
      const opts = savedTemplate.optionType.split('');
      return (
        <div key={c.id} style={base}>
          <div style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#000' }}>答 案</div>
          <div style={{ display: 'flex', gap: c.gap || 6, justifyContent: 'center' }}>
            {Array.from({ length: columns }).map((_, col) => {
              const start = col * per;
              const end = Math.min(start + per, savedTemplate.questionCount);
              return (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.from({ length: end - start }).map((_, row) => {
                    const q = start + row;
                    const ans = savedTemplate.answers[q];
                    return (
                      <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                        <span style={{ width: 18, textAlign: 'right', fontWeight: 'bold', color: '#000' }}>{q + 1}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {opts.map(o => {
                                const isSelected = ans === 'ALL' || ans === o;
                                const shape = c.shape || 'circle';
                                const size = c.size || 16;
                                let width = size;
                                let height = size;
                                let borderRadius = '50%';
                                if (shape === 'ellipse') {
                                  width = size * 1.5;
                                  height = size;
                                  borderRadius = '50%';
                                } else if (shape === 'roundRect') {
                                  width = size * 1.8;
                                  height = size;
                                  borderRadius = size * 0.3;
                                }
                                const fontSize = Math.max(9, Math.floor(size * 0.6));
                                return (
                                  <div
                                    key={o}
                                    style={{
                                      width,
                                      height,
                                      border: '2px solid #333',
                                      borderRadius,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize,
                                      fontWeight: 'bold',
                                      background: isSelected ? '#333' : '#fff',
                                      color: isSelected ? '#fff' : '#999'
                                    }}
                                  >
                                    {o}
                                  </div>
                                );
                              })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    // 作答区：在保存模板中显示线条
    if (c.type === 'essayArea') {
      const { columns, per } = calculateLayout(savedTemplate.questionCount);
      return (
        <div key={c.id} style={{ ...base }}>
          <div
            style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#000' }}
          >
            {t('essay_area_name')}
          </div>
          <div style={{ display: 'flex', gap: c.gap || 6, justifyContent: 'center' }}>
            {Array.from({ length: columns }).map((_, col) => {
              const start = col * per;
              const end = Math.min(start + per, savedTemplate.questionCount);
              return (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Array.from({ length: end - start }).map((_, row) => {
                    const q = start + row;
                    return (
                      <div key={q} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 10 }}>
                        <span
                          style={{ width: 18, textAlign: 'right', fontWeight: 'bold', color: '#000', paddingTop: 4 }}
                        >
                          {q + 1}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {[1, 2, 3].map(line => (
                            <div key={line} style={{ width: 180, height: 12, borderBottom: '1px solid #333' }}></div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    // 标题、副标题、机密等文本
    if (c.type === 'title' || c.type === 'subtitle' || c.type === 'confidential') {
      return (
        <div key={c.id} style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              fontWeight: 'bold',
              fontSize: c.fontSize || (c.type === 'title' ? 16 : c.type === 'subtitle' ? 14 : 12),
              color: '#000',
              fontFamily: c.fontFamily || 'SimSun'
            }}
          >
            {def.text}
          </span>
        </div>
      );
    }
    // 标签类组件，例如考生编号等
    if (def.label) {
      return (
        <div key={c.id} style={base}>
          <div
            style={{
              fontSize: c.fontSize || 11,
              fontWeight: 'bold',
              marginBottom: 4,
              color: '#000',
              fontFamily: c.fontFamily || 'SimSun'
            }}
          >
            {def.label}
          </div>
          <div style={{ borderBottom: '2px solid #333', height: 20 }}></div>
        </div>
      );
    }
    // 学科编号组件
    if (c.type === 'subjectCode') {
      return (
        <div key={c.id} style={{ ...base, border: '2px solid #333' }}>
          <div
            style={{
              fontSize: c.fontSize || 11,
              fontWeight: 'bold',
              marginBottom: 6,
              color: '#000',
              fontFamily: c.fontFamily || 'SimSun'
            }}
          >
            学科编号: {savedTemplate.subjectCode}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {['V', 'Y', 'D'].map(code => (
              <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>{code}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <div
                      key={n}
                      style={{ width: 10, height: 10, border: '1px solid #333', borderRadius: '50%' }}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 考届组件：显示考届及其值
    if (c.type === 'examSession') {
      return (
        <div key={c.id} style={base}>
          <div
            style={{
              fontSize: c.fontSize || 11,
              fontWeight: 'bold',
              marginBottom: 4,
              color: '#000',
              fontFamily: c.fontFamily || 'SimSun'
            }}
          >
            {t('exam_session_label')}: {savedTemplate.examSession}
          </div>
          <div style={{ borderBottom: '2px solid #333', height: 20 }}></div>
        </div>
      );
    }

    // 考场编号组件：显示考场编号及其值
    if (c.type === 'centreCode') {
      return (
        <div key={c.id} style={base}>
          <div
            style={{
              fontSize: c.fontSize || 11,
              fontWeight: 'bold',
              marginBottom: 4,
              color: '#000',
              fontFamily: c.fontFamily || 'SimSun'
            }}
          >
            {t('centre_code_label')}: {savedTemplate.centreCode}
          </div>
          <div style={{ borderBottom: '2px solid #333', height: 20 }}></div>
        </div>
      );
    }

    // 人数组件：显示人数
    if (c.type === 'numStudents') {
      return (
        <div key={c.id} style={base}>
          <div
            style={{
              fontSize: c.fontSize || 11,
              fontWeight: 'bold',
              marginBottom: 4,
              color: '#000',
              fontFamily: c.fontFamily || 'SimSun'
            }}
          >
            {t('num_students_label')}: {savedTemplate.numStudents}
          </div>
          <div style={{ borderBottom: '2px solid #333', height: 20 }}></div>
        </div>
      );
    }

    // 缺席标记区域：按人数展示编号和空圆
    if (c.type === 'absenceGrid') {
      const total = savedTemplate.numStudents || 0;
      const { columns, per } = calculateLayout(total);
      const header = t('absence_area_title');
      return (
        <div key={c.id} style={{ ...base }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#000' }}>{header}</div>
          <div style={{ display: 'flex', gap: c.gap || 6, justifyContent: 'center' }}>
            {Array.from({ length: columns }).map((_, col) => {
              const start = col * per;
              const end = Math.min(start + per, total);
              return (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.from({ length: end - start }).map((_, row) => {
                    const q = start + row;
                    return (
                      <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                        <span style={{ width: 18, textAlign: 'right', fontWeight: 'bold', color: '#000' }}>{q + 1}</span>
                        <div style={{ width: c.size || 16, height: c.size || 16, border: '2px solid #333', borderRadius: '50%' }}></div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // 拖拽处理：根据鼠标移动更新组件位置
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingId !== null && designAreaRef.current) {
        const rect = designAreaRef.current.getBoundingClientRect();
        // 设计区域的宽高为未缩放尺寸（794x1123）。boundingRect 会随缩放而改变
        const designWidth = 794;
        const designHeight = 1123;
        // 将鼠标位置转换为未缩放坐标系
        let x = (e.clientX - rect.left - dragOffset.dx) / zoom;
        let y = (e.clientY - rect.top - dragOffset.dy) / zoom;
        // 网格对齐：四舍五入到最近的 gridSpacing
        if (gridEnabled) {
          x = Math.round(x / gridSpacing) * gridSpacing;
          y = Math.round(y / gridSpacing) * gridSpacing;
        }
        setComponents((comps) =>
          comps.map((c) => {
            if (c.id !== draggingId) return c;
            // 限制在设计区域范围内
            const newX = Math.max(0, Math.min(designWidth - c.w, x));
            const newY = Math.max(0, Math.min(designHeight - c.h, y));
            return { ...c, x: newX, y: newY };
          })
        );
      }
    };
    const handleMouseUp = () => {
      if (draggingId !== null) setDraggingId(null);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dragOffset, gridEnabled, zoom]);

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <div style={{ background: 'white', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 20 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 标题和副标题，根据语言选择显示 */}
          <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: '0 0 5px 0', color: '#111' }}>📋 {t('title_main')}</h1>
          {/* 始终显示英文副标题，方便双语用户识别 */}
          <p style={{ color: '#666', margin: 0, fontSize: 14 }}>{translations.en.title_main}</p>
          {/* 顶部标签导航与语言选择 */}
          <div
            style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', gap: 20 }}>
              <button
                onClick={() => setTab('templates')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom:
                    tab === 'templates' ? '3px solid #4F46E5' : '3px solid transparent',
                  padding: '8px 12px',
                  fontSize: 16,
                  fontWeight: tab === 'templates' ? 600 : 500,
                  color: tab === 'templates' ? '#4F46E5' : '#4B5563',
                  cursor: 'pointer'
                }}
              >
                {t('tab_templates')}
              </button>
              <button
                onClick={() => setTab('scanner')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom:
                    tab === 'scanner' ? '3px solid #4F46E5' : '3px solid transparent',
                  padding: '8px 12px',
                  fontSize: 16,
                  fontWeight: tab === 'scanner' ? 600 : 500,
                  color: tab === 'scanner' ? '#4F46E5' : '#4B5563',
                  cursor: 'pointer'
                }}
              >
                {t('tab_scanner')}
              </button>
            </div>
            {/* 语言选择器 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#4B5563' }}>{t('language_label')}:</span>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, color: '#111' }}
              >
                <option value="zh">{t('chinese_language')}</option>
                <option value="en">{t('english_language')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
        {tab === 'templates' && view === 'list' && (
            <div style={{ background: 'white', padding: 30, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: 22, fontWeight: 'bold', margin: 0, color: '#111' }}>📄 {t('template_list_title')}</h2>
              <button
                onClick={() => setShowTypeSelection(true)}
                style={{
                  background: '#4F46E5',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Plus size={20} /> {t('create_template')}
              </button>
            </div>
            {/* 搜索和过滤 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flexGrow: 1, minWidth: 200, padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, color: '#111' }}
              />
              {/* 显示模板总数和匹配数量 */}
              {(() => {
                const term = searchTerm.toLowerCase();
                const filteredCount = templates.filter(tmpl => {
                  const typeLabelKey = `template_type_${tmpl.templateType || 'choice'}`;
                  const typeLabel = (translations[language] && translations[language][typeLabelKey]) || typeLabelKey;
                  return (
                    tmpl.name.toLowerCase().includes(term) ||
                    tmpl.subject.toLowerCase().includes(term) ||
                    tmpl.subjectCode.toLowerCase().includes(term) ||
                    typeLabel.toLowerCase().includes(term)
                  );
                }).length;
                return (
                  <div style={{ fontSize: 14, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {t('total_templates')}: {templates.length} / {t('matched_templates')}: {filteredCount}
                  </div>
                );
              })()}
            </div>
            {(() => {
              const term = searchTerm.toLowerCase();
              const filtered = templates.filter(tmpl => {
                const typeLabelKey = `template_type_${tmpl.templateType || 'choice'}`;
                const typeLabel = (translations[language] && translations[language][typeLabelKey]) || typeLabelKey;
                return (
                  tmpl.name.toLowerCase().includes(term) ||
                  tmpl.subject.toLowerCase().includes(term) ||
                  tmpl.subjectCode.toLowerCase().includes(term) ||
                  typeLabel.toLowerCase().includes(term)
                );
              });
              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                    <p style={{ fontSize: 18 }}>{t('no_templates')}</p>
                  </div>
                );
              }
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {filtered.map(tmpl => (
                    <div key={tmpl.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 'bold', color: '#111' }}>{tmpl.name}</h3>
                            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>{tmpl.subject}</p>
                          </div>
                          <button
                          onClick={() => confirm(t('delete_confirm')) && setTemplates(templates.filter(x => x.id !== tmpl.id))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                        <p style={{ margin: '4px 0', fontSize: 14, color: '#6B7280' }}>
                          {t('questions_label')}: {tmpl.questionCount} | {t('options_label')}: {tmpl.optionType}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: 14, color: '#6B7280' }}>
                          {t('answers_label')}: {tmpl.answers.filter(a => a).length}/{tmpl.questionCount}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: 14, color: '#6B7280' }}>
                          {t('template_type_label')}: {t(`template_type_${tmpl.templateType || 'choice'}`)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                        {/* 查看预览按钮 */}
                        <button
                          onClick={() => {
                            setSavedTemplate(tmpl);
                            setView('summary');
                          }}
                          style={{
                            background: '#3B82F6',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 14
                          }}
                        >
                          {t('view_preview')}
                        </button>
                        {/* 更改标准答案按钮：进入答案编辑模式 */}
                        <button
                          onClick={() => {
                            // 切换到模板标签，并加载所选模板进行答案编辑
                            setTab('templates');
                            setCurrentTemplate({ ...tmpl });
                            setComponents(tmpl.layout || []);
                            setSelected(null);
                            setView('answers');
                          }}
                          style={{
                            background: '#F59E0B',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 14
                          }}
                        >
                          {t('edit_answers')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            {/* 模板类型选择弹窗 */}
            {showTypeSelection && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 999
                }}
              >
                <div
                  style={{
                    background: 'white',
                    padding: 30,
                    borderRadius: 12,
                    width: '90%',
                    maxWidth: 500,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    textAlign: 'center'
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 20, color: '#111' }}>{t('select_template_type')}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <button
                      onClick={() => {
                        startCreate('choice');
                        setShowTypeSelection(false);
                      }}
                      style={{ padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer', fontSize: 16, color: '#1D4ED8' }}
                    >
                      {t('template_type_choice')}
                    </button>
                    <button
                      onClick={() => {
                        startCreate('essay');
                        setShowTypeSelection(false);
                      }}
                      style={{ padding: '12px 16px', background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: 8, cursor: 'pointer', fontSize: 16, color: '#B45309' }}
                    >
                      {t('template_type_essay')}
                    </button>
                    <button
                      onClick={() => {
                        startCreate('absence');
                        setShowTypeSelection(false);
                      }}
                      style={{ padding: '12px 16px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, cursor: 'pointer', fontSize: 16, color: '#047857' }}
                    >
                      {t('template_type_absence')}
                    </button>
                    <button
                      onClick={() => {
                        startCreate('final');
                        setShowTypeSelection(false);
                      }}
                      style={{ padding: '12px 16px', background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: 8, cursor: 'pointer', fontSize: 16, color: '#A21CAF' }}
                    >
                      {t('template_type_final')}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowTypeSelection(false)}
                    style={{ padding: '8px 16px', background: '#E5E7EB', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#374151' }}
                  >
                    {t('back')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'templates' && view === 'designer' && (
          <div>
            <div style={{ background: 'white', padding: 16, borderRadius: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => confirm(t('confirm_discard_changes')) && setView('list')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <ArrowLeft size={20} /> {t('back')}
              </button>
              <h3 style={{ margin: 0, color: '#111' }}>{t('design_answer_sheet')}</h3>
              <button
                onClick={goToAnswers}
                style={{
                  background: '#4F46E5',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                {t('next')}
              </button>
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#111' }}>{t('template_name_label')} *</label>
                  <input value={currentTemplate.name} onChange={e => setCurrentTemplate({ ...currentTemplate, name: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', color: '#111' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#111' }}>{t('subject_label')} *</label>
                  <input value={currentTemplate.subject} onChange={e => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', color: '#111' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#111' }}>{t('subject_code_label')} *</label>
                  <input value={currentTemplate.subjectCode} onChange={e => setCurrentTemplate({ ...currentTemplate, subjectCode: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', color: '#111' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#111' }}>{t('question_count_label')}</label>
                  <input type="number" min="1" max="150" value={currentTemplate.questionCount} onChange={e => { const n = Math.max(1, Math.min(150, parseInt(e.target.value) || 30)); setCurrentTemplate({ ...currentTemplate, questionCount: n, answers: Array(n).fill('') }); }} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', color: '#111' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#111' }}>{t('option_type_label')}</label>
                  <select value={currentTemplate.optionType} onChange={e => setCurrentTemplate({ ...currentTemplate, optionType: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', color: '#111' }}>
                    <option value="ABCD">ABCD</option>
                    <option value="ABCDE">ABCDE</option>
                    <option value="ABCDEF">ABCDEF</option>
                  </select>
                </div>
                {/* 新增：考届输入 */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#111' }}>{t('exam_session_label')} *</label>
                  <input value={currentTemplate.examSession || ''} onChange={e => setCurrentTemplate({ ...currentTemplate, examSession: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', color: '#111' }} />
                </div>
                {/* 新增：考场编号输入 */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#111' }}>{t('centre_code_label')} *</label>
                  <input value={currentTemplate.centreCode || ''} onChange={e => setCurrentTemplate({ ...currentTemplate, centreCode: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', color: '#111' }} />
                </div>
                {/* 新增：人数输入（仅缺席卡使用） */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#111' }}>{t('num_students_label')}</label>
                  <input type="number" min="0" value={currentTemplate.numStudents || 0} onChange={e => setCurrentTemplate({ ...currentTemplate, numStudents: Math.max(0, parseInt(e.target.value) || 0) })} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', color: '#111' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 250px', gap: 16 }}>
              <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
                <h4 style={{ marginTop: 0, color: '#111' }}>🧩 {t('component_library')}</h4>
                {componentTypes.map(c => {
                  const Icon = c.icon;
                  return (
                    <button key={c.id} draggable onDragStart={e => e.dataTransfer.setData('type', c.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 12, marginBottom: 8, background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'move', fontSize: 14, color: '#111' }}>
                      <Icon size={18} /> {c.name}
                    </button>
                  );
                })}
              </div>

              <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
                {/* 控制栏：网格、标尺、缩放 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#111' }}>
                      <input type="checkbox" checked={gridEnabled} onChange={e => setGridEnabled(e.target.checked)} /> 网格
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#111' }}>
                      <input type="checkbox" checked={showRulers} onChange={e => setShowRulers(e.target.checked)} /> 标尺
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => setZoom(prev => Math.min(3, Math.round((prev + 0.1) * 10) / 10))}
                      style={{ padding: '4px 8px', background: '#E0E7FF', border: '1px solid #C7D2FE', borderRadius: 4, cursor: 'pointer', fontSize: 14, color: '#374151' }}
                    >+
                    </button>
                    <button
                      onClick={() => setZoom(prev => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
                      style={{ padding: '4px 8px', background: '#E0E7FF', border: '1px solid #C7D2FE', borderRadius: 4, cursor: 'pointer', fontSize: 14, color: '#374151' }}
                    >-
                    </button>
                    <span style={{ fontSize: 14, color: '#374151' }}>{Math.round(zoom * 100)}%</span>
                  </div>
                </div>
                {/* 设计区域容器：包含标尺和缩放后的画布 */}
                <div style={{ overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB' }}>
                  <div style={{ position: 'relative', width: 30 + 794 * zoom, height: 20 + 1123 * zoom }}>
                    {/* 顶部标尺 */}
                    {showRulers && (
                      <div style={{ position: 'absolute', top: 0, left: 30, width: 794 * zoom, height: 20, background: '#F3F4F6', borderBottom: '1px solid #D1D5DB' }}>
                        {Array.from({ length: Math.floor(794 / 50) + 1 }).map((_, i) => {
                          const pos = i * 50 * zoom;
                          const label = i * 50;
                          return (
                            <div key={i} style={{ position: 'absolute', left: pos, top: 0, width: 1, height: 20 }}>
                              <div style={{ width: 1, height: 8, background: '#6B7280' }}></div>
                              <div style={{ position: 'absolute', top: 8, left: -10, fontSize: 8, color: '#6B7280' }}>{label}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* 左侧标尺 */}
                    {showRulers && (
                      <div style={{ position: 'absolute', top: 20, left: 0, width: 30, height: 1123 * zoom, background: '#F3F4F6', borderRight: '1px solid #D1D5DB' }}>
                        {Array.from({ length: Math.floor(1123 / 50) + 1 }).map((_, i) => {
                          const pos = i * 50 * zoom;
                          const label = i * 50;
                          return (
                            <div key={i} style={{ position: 'absolute', top: pos, left: 0 }}>
                              <div style={{ width: 8, height: 1, background: '#6B7280' }}></div>
                              <div style={{ position: 'absolute', top: -5, left: 9, fontSize: 8, color: '#6B7280' }}>{label}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* 缩放包装器和设计区域 */}
                    <div style={{ position: 'absolute', top: 20, left: 30 }}>
                      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 794, height: 1123 }}>
                        <div
                          ref={designAreaRef}
                          onDrop={handleDrop}
                          onDragOver={e => e.preventDefault()}
                          style={{
                            position: 'relative',
                            width: 794,
                            height: 1123,
                            background: '#FFFFFF',
                            border: '2px solid #E5E7EB',
                            borderRadius: 8,
                            // 网格背景
                            backgroundImage: gridEnabled ?
                              `linear-gradient(to right, #E5E7EB 1px, transparent 1px), linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)` :
                              'none',
                            backgroundSize: `${gridSpacing * zoom}px ${gridSpacing * zoom}px`,
                            overflow: 'hidden'
                          }}
                        >
                          {/* 对齐参考线 */}
                          {draggingId !== null && (() => {
                            const dComp = components.find(c => c.id === draggingId);
                            if (dComp) {
                              return (
                                <>
                                  <div style={{ position: 'absolute', left: dComp.x, top: 0, width: 1, height: '100%', background: 'rgba(79,70,229,0.4)', pointerEvents: 'none' }}></div>
                                  <div style={{ position: 'absolute', left: 0, top: dComp.y, width: '100%', height: 1, background: 'rgba(79,70,229,0.4)', pointerEvents: 'none' }}></div>
                                </>
                              );
                            }
                            return null;
                          })()}
                          {components.map(c => renderComp(c))}
                          {components.length === 0 && (
                            <div
                              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}
                            >
                              {t('add_component_hint')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
                <h4 style={{ marginTop: 0, color: '#111' }}>⚙️ {t('properties')}</h4>
                {selected ? (
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: 16, color: '#111' }}>{componentTypes.find(c => c.id === selected.type)?.name}</p>
                    {['x', 'y', 'w', 'h'].map(p => (
                      <div key={p} style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 14, marginBottom: 4, color: '#111' }}>{p.toUpperCase()}</label>
                        <input
                          type="number"
                          value={selected[p]}
                          onChange={e => updateProp(p, e.target.value)}
                          style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6, color: '#111' }}
                        />
                      </div>
                    ))}
                    {/* 当选择答题区时，允许调整列间距 */}
                    {selected.type === 'answerGrid' && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 14, marginBottom: 4, color: '#111' }}>{t('gap_label')}</label>
                        <input
                          type="number"
                          value={selected.gap || 6}
                          onChange={e => updateProp('gap', e.target.value)}
                          style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6, color: '#111' }}
                        />
                      </div>
                    )}
                    {/* 当选择答题区时，允许调整答案形状和大小 */}
                    {selected.type === 'answerGrid' && (
                      <>
                        <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 14, marginBottom: 4, color: '#111' }}>{t('shape_label')}</label>
                          <select
                            value={selected.shape || 'circle'}
                            onChange={e => updateProp('shape', e.target.value)}
                            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6, color: '#111' }}
                          >
                            <option value="circle">圆形</option>
                            <option value="ellipse">椭圆形</option>
                            <option value="roundRect">圆角矩形</option>
                          </select>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: 14, marginBottom: 4, color: '#111' }}>{t('size_label')}</label>
                          <input
                            type="number"
                            value={selected.size || 16}
                            onChange={e => updateProp('size', e.target.value)}
                            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6, color: '#111' }}
                          />
                        </div>
                      </>
                    )}
                    {/* 当选择文本类组件时，允许调整字体大小 */}
                    {(['title', 'subtitle', 'confidential', 'studentId', 'studentName', 'school', 'subject', 'subjectCode'].includes(selected.type)) && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 14, marginBottom: 4, color: '#111' }}>{t('font_size_label')}</label>
                        <input
                          type="number"
                          value={selected.fontSize || (selected.type === 'title' ? 16 : selected.type === 'subtitle' ? 14 : 12)}
                          onChange={e => updateProp('fontSize', e.target.value)}
                          style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6, color: '#111' }}
                        />
                      </div>
                    )}
                    {/* 当选择文本类组件时，显示字体选择列表 */}
                    {(['title', 'subtitle', 'confidential', 'studentId', 'studentName', 'school', 'subject', 'subjectCode'].includes(selected.type)) && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 14, marginBottom: 4, color: '#111' }}>{t('font_label')}</label>
                        <select
                          value={selected.fontFamily || 'SimSun'}
                          onChange={e => updateProp('fontFamily', e.target.value)}
                          style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6, color: '#111' }}
                        >
                          <option value="SimSun">宋体 (SimSun)</option>
                          <option value="KaiTi">楷体 (KaiTi)</option>
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="sans-serif">默认 (Sans-Serif)</option>
                        </select>
                      </div>
                    )}
                    <button
                      onClick={() => confirm(t('delete_confirm')) && (setComponents(components.filter(c => c.id !== selected.id)), setSelected(null))}
                      style={{ width: '100%', padding: 10, background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                    >
                      <Trash2 size={16} style={{ display: 'inline', marginRight: 8 }} /> {t('delete')}
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>{t('click_to_view_props')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'templates' && view === 'answers' && (
          <div style={{ background: 'white', padding: 40, borderRadius: 12, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
              <button onClick={() => setView('designer')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowLeft size={20} /> {t('back')}
              </button>
              <h2 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, color: '#111' }}>{t('set_answers_title')}</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setView('preview')} style={{ background: '#3B82F6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>{t('preview_button')}</button>
                <button onClick={saveTemplate} style={{ background: '#10B981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={20} /> {t('save')}
                </button>
              </div>
            </div>

            {/* 答案设置区域 */}
            {currentTemplate.templateType !== 'choice' ? (
              <div style={{ padding: 20, background: '#F9FAFB', borderRadius: 8, textAlign: 'center', color: '#6B7280' }}>
                {t('no_answers_for_template')}
              </div>
            ) : (
              <>
                <div style={{ padding: 20, background: '#F9FAFB', borderRadius: 8, maxHeight: 500, overflowY: 'auto' }}>
                  {(() => {
                    const { columns, per } = calculateLayout(currentTemplate.questionCount);
                    return (
                      <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                        {Array.from({ length: columns }).map((_, col) => {
                          const start = col * per;
                          const end = Math.min(start + per, currentTemplate.questionCount);
                          return (
                            <div key={col}>
                              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, marginBottom: 12, padding: 8, background: '#E0E7FF', borderRadius: 6, color: '#111' }}>
                                题 {start + 1} - {end}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {Array.from({ length: end - start }).map((_, row) => {
                                  const q = start + row;
                                  return (
                                    <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ width: 30, textAlign: 'right', fontWeight: 'bold', fontSize: 14, color: '#111' }}>{q + 1}.</span>
                                      <select
                                        value={currentTemplate.answers[q] || ''}
                                        onChange={e => {
                                          const ans = [...currentTemplate.answers];
                                          ans[q] = e.target.value;
                                          setCurrentTemplate({ ...currentTemplate, answers: ans });
                                        }}
                                        style={{
                                          padding: '6px 12px',
                                          border: '1px solid #D1D5DB',
                                          borderRadius: 6,
                                          fontSize: 14,
                                          fontWeight: 600,
                                          textAlign: 'center',
                                          minWidth: 80,
                                          color: '#111'
                                        }}
                                      >
                                        <option value="">-</option>
                                        {currentTemplate.optionType.split('').map(o => (
                                          <option key={o} value={o}>
                                            {o}
                                          </option>
                                        ))}
                                        {/* Bonus option 表示全部选项均正确 */}
                                        <option value="ALL">Bonus (全对)</option>
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                <div style={{ marginTop: 12, textAlign: 'center', fontSize: 14, color: '#6B7280' }}>
                  已设置 <strong style={{ color: '#4F46E5', fontSize: 16 }}>{currentTemplate.answers.filter(a => a).length}</strong> / {currentTemplate.questionCount} 题
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'templates' && view === 'preview' && (
          <div style={{ background: 'white', padding: 40, borderRadius: 12, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
              <button onClick={() => setView('answers')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowLeft size={20} /> 返回
              </button>
              <h2 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, color: '#111' }}>{t('answer_preview_title')}</h2>
              <button
                onClick={saveTemplate}
                style={{ background: '#10B981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Save size={20} /> {t('save_template')}
              </button>
            </div>
            {/* 模板信息 */}
            <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <strong>{t('template_info_label_name')}:</strong> {currentTemplate.name || '-'}
              </div>
              <div>
                <strong>{t('template_info_label_subject')}:</strong> {currentTemplate.subject || '-'}
              </div>
              <div>
                <strong>{t('template_info_label_subject_code')}:</strong> {currentTemplate.subjectCode || '-'}
              </div>
              <div>
                <strong>{t('template_info_label_qcount')}:</strong> {currentTemplate.questionCount}
              </div>
              <div>
                <strong>{t('template_info_label_option_type')}:</strong> {currentTemplate.optionType}
              </div>
            </div>
            {/* 答题卡预览区域 */}
            <div style={{ padding: 20, background: '#F9FAFB', borderRadius: 8, maxHeight: 600, overflowY: 'auto' }}>
              {(() => {
                const { columns, per } = calculateLayout(currentTemplate.questionCount);
                const opts = currentTemplate.optionType.split('');
                // 从设计组件中读取答题区的形状和大小
                const answerGridComp = components.find(c => c.type === 'answerGrid') || {};
                const shape = answerGridComp.shape || 'circle';
                const size = answerGridComp.size || 16;
                return (
                  <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                    {Array.from({ length: columns }).map((_, col) => {
                      const start = col * per;
                      const end = Math.min(start + per, currentTemplate.questionCount);
                      return (
                        <div key={col}>
                          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, marginBottom: 12, padding: 8, background: '#E0E7FF', borderRadius: 6, color: '#111' }}>
                            题 {start + 1} - {end}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Array.from({ length: end - start }).map((_, row) => {
                              const q = start + row;
                              const ans = currentTemplate.answers[q];
                              return (
                                <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ width: 30, textAlign: 'right', fontWeight: 'bold', fontSize: 14, color: '#111' }}>{q + 1}.</span>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {opts.map(o => {
                                      const isSelected = ans === 'ALL' || ans === o;
                                      // 计算形状与大小
                                      let w = size;
                                      let h = size;
                                      let br = '50%';
                                      if (shape === 'ellipse') {
                                        w = size * 1.5;
                                        h = size;
                                        br = '50%';
                                      } else if (shape === 'roundRect') {
                                        w = size * 1.8;
                                        h = size;
                                        br = size * 0.3;
                                      }
                                      const fs = Math.max(9, Math.floor(size * 0.6));
                                      return (
                                        <div
                                          key={o}
                                          style={{
                                            width: w,
                                            height: h,
                                            border: '2px solid #333',
                                            borderRadius: br,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: fs,
                                            fontWeight: 'bold',
                                            background: isSelected ? '#333' : '#fff',
                                            color: isSelected ? '#fff' : '#999'
                                          }}
                                        >
                                          {o}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* 总预览页面：保存模板后显示完整预览 */}
        {tab === 'templates' && view === 'summary' && savedTemplate && (
          <div
            style={{ background: 'white', padding: 40, borderRadius: 12, maxWidth: 1200, margin: '0 auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
              <button
                onClick={() => setView('list')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <ArrowLeft size={20} /> {t('return_to_list')}
              </button>
              <h2 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, color: '#111' }}>
                {t('total_preview_title')}
              </h2>
              <div></div>
            </div>
            {/* 模板信息 */}
            <div
              style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}
            >
              <div>
                <strong>{t('template_info_label_name')}:</strong> {savedTemplate.name || '-'}
              </div>
              <div>
                <strong>{t('template_info_label_subject')}:</strong> {savedTemplate.subject || '-'}
              </div>
              <div>
                <strong>{t('template_info_label_subject_code')}:</strong> {savedTemplate.subjectCode || '-'}
              </div>
              <div>
                <strong>{t('template_info_label_qcount')}:</strong> {savedTemplate.questionCount}
              </div>
              <div>
                <strong>{t('template_info_label_option_type')}:</strong> {savedTemplate.optionType}
              </div>
            </div>
            {/* 完整答题卡预览：按照设计布局渲染所有组件 */}
            <div
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                position: 'relative',
                width: 794,
                height: 1123,
                margin: '0 auto',
                overflow: 'hidden'
              }}
            >
              {savedTemplate.layout && savedTemplate.layout.map(c => renderSavedComp(c))}
            </div>
          </div>
        )}

        {/* 扫描仪模块 */}
        {tab === 'scanner' && (
          <div
            style={{
              background: 'white',
              padding: 40,
              borderRadius: 12,
              maxWidth: 800,
              margin: '0 auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <h2
              style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Scan size={24} /> {t('scan_module_title')}
            </h2>
            {/* 选择判分模板 */}
            <div
              style={{
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap'
              }}
            >
              <span style={{ fontSize: 14, color: '#111' }}>{t('select_scan_template_label')}:</span>
              {templates.length > 0 ? (
                <select
                  value={selectedScanTemplateId || (templates[0] && templates[0].id)}
                  onChange={e => setSelectedScanTemplateId(parseInt(e.target.value))}
                  style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, color: '#111' }}
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: 14, color: '#999' }}>{t('no_template_available')}</span>
              )}
            </div>

            {/* 连接状态和操作按钮 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div style={{ fontSize: 16, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{t('status_label')}:</span>
                <strong>{scannerConnected ? t('connected') : t('disconnected')}</strong>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    // 切换连接状态时重置扫描结果
                    setScannerConnected(prev => !prev);
                    setScanResults([]);
                  }}
                  style={{
                    background: scannerConnected ? '#EF4444' : '#10B981',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  {scannerConnected ? t('disconnect_scanner_button') : t('connect_scanner_button')}
                </button>
                <button
                  onClick={handleScan}
                  disabled={!scannerConnected}
                  style={{
                    background: scannerConnected ? '#4F46E5' : '#A5B4FC',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: scannerConnected ? 'pointer' : 'not-allowed',
                    fontSize: 14
                  }}
                >
                  {t('scan_sheet_button')}
                </button>
              </div>
            </div>
            {/* 操作指导步骤 */}
            <div style={{ marginBottom: 24, fontSize: 14, color: '#374151' }}>
              <p style={{ margin: '0 0 8px 0' }}>{t('steps_title')}</p>
              <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 1.6 }}>
                <li>{t('step1')}</li>
                <li>{t('step2')}</li>
                <li>{t('step3')}</li>
                <li>{t('step4')}</li>
              </ol>
            </div>
            {/* 扫描结果展示：支持多张答题卡 */}
            {scanResults.length > 0 && (
              <div style={{ marginTop: 24 }}>
                {scanResults.map((res, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 24,
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      background: '#F9FAFB',
                      marginBottom: 16
                    }}
                  >
                    <h3
                      style={{ margin: '0 0 12px 0', fontSize: 20, color: '#111', fontWeight: 600 }}
                    >
                      📄 {t('scan_results_title_with_index', { n: idx + 1 })}
                    </h3>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '120px 1fr',
                        rowGap: 12,
                        columnGap: 20,
                        fontSize: 14,
                        color: '#111'
                      }}
                    >
                      {res.examId && (
                        <>
                          <div>{t('exam_id_label')}:</div>
                          <div>{res.examId}</div>
                        </>
                      )}
                      {res.name && (
                        <>
                          <div>{t('name_label')}:</div>
                          <div>{res.name}</div>
                        </>
                      )}
                      <div>{t('subject_label')}:</div>
                      <div>{res.subject}</div>
                      <div>{t('question_count_result_label')}:</div>
                      <div>{res.questionCount}</div>
                      {res.correctCount !== undefined && (
                        <>
                          <div>{t('correct_count_label')}:</div>
                          <div>{res.correctCount}</div>
                        </>
                      )}
                      {res.score && (
                        <>
                          <div>{t('score_label')}:</div>
                          <div>{res.score}</div>
                        </>
                      )}
                      {res.answers && (
                        <>
                          <div>{t('answer_preview_label')}:</div>
                          <div style={{ wordBreak: 'break-all' }}>
                            {res.answers.slice(0, 20).join(' , ')}
                            {res.answers.length > 20 && ' ...'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {/* 导出按钮 */}
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button
                    onClick={exportResults}
                    style={{
                      background: '#10B981',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    {t('export_results_button')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamScannerSystem;