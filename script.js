/* 
  =====================================================
  SCRIPT.JS
  ملفات التحكم بالتفاعلية للموقع التعليمي - مسار الويب الشامل
  =====================================================
*/

// انتظر تحميل الصفحة بالكامل
document.addEventListener("DOMContentLoaded", function() {
  
  // 1. تفعيل زر القائمة للجوال (Mobile Navigation Toggle)
  var menuToggle = document.getElementById("menu-toggle");
  var navMenu = document.getElementById("nav-menu");
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", function() {
      // تفعيل القائمة وإلغائها باستخدام كلاس active لتجنب مشاكل تكبير حجم الشاشة
      navMenu.classList.toggle("active");
    });
  }

  // 2. تتبع تقدم الدروس (Lesson Progress Tracker)
  // التحقق التلقائي من نوع الدرس الحالي وحفظ تقدمه
  var isCSS = window.location.href.match(/\/lessons\/css\/lesson(\d+)\.html/i);
  var isJS = window.location.href.match(/\/lessons\/js\/lesson(\d+)\.html/i);
  var isHTML = window.location.href.match(/\/lessons\/lesson(\d+)\.html/i);

  if (isCSS) {
    markLessonAsCompleted('css', parseInt(isCSS[1], 10));
  } else if (isJS) {
    markLessonAsCompleted('js', parseInt(isJS[1], 10));
  } else if (isHTML) {
    markLessonAsCompleted('html', parseInt(isHTML[1], 10));
  }
  
  initializeProgress();
  
  // 3. كود تشغيل محرر الملعب في الصفحة الرئيسية (Home Page Demo Editor)
  var runBtn = document.getElementById("run-btn");
  if (runBtn) {
    runBtn.addEventListener("click", runCode);
    // تشغيل أولي لعرض النتيجة الافتراضية
    runCode();
  }

});

// دالة لتشغيل الكود في الصفحة الرئيسية
function runCode() {
  var code = document.getElementById("code-editor").value;
  var iframe = document.getElementById("output-frame");
  
  if (iframe) {
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write('<html lang="ar" dir="rtl"><head><style>body { font-family: sans-serif; padding: 10px; margin: 0; color: #333; line-height: 1.5; } h1 { color: #007bff; }</style></head><body>' + code + '</body></html>');
    iframeDoc.close();
  }
}

// دالة التبديل بين تبويبات الدروس في الصفحة الرئيسية
function switchLessonsTab(tabId) {
  var contents = document.querySelectorAll(".lessons-section .tab-content");
  contents.forEach(function(content) {
    content.classList.remove("active");
    content.style.display = "none";
  });

  var buttons = document.querySelectorAll(".lessons-tabs .tab-btn");
  buttons.forEach(function(btn) {
    btn.classList.remove("active");
  });

  var targetContent = document.getElementById(tabId + "-lessons");
  if (targetContent) {
    targetContent.classList.add("active");
    targetContent.style.display = "grid";
  }

  // تحديد الزر النشط
  var activeBtn = document.querySelector(".lessons-tabs .tab-btn[onclick*='" + tabId + "']");
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

// دالة التبديل بين تبويبات قائمة تتبع التقدم في الصفحة الرئيسية
function switchProgressTab(tabId) {
  var contents = document.querySelectorAll(".progress-tracker .progress-content");
  contents.forEach(function(content) {
    content.classList.remove("active");
    content.style.display = "none";
  });

  var buttons = document.querySelectorAll(".progress-tabs .progress-tab-btn");
  buttons.forEach(function(btn) {
    btn.classList.remove("active");
  });

  var targetContent = document.getElementById(tabId + "-progress-list");
  if (targetContent) {
    targetContent.classList.add("active");
    targetContent.style.display = "flex";
  }

  // تحديد الزر النشط
  var activeBtn = document.querySelector(".progress-tabs .progress-tab-btn[onclick*='" + tabId + "']");
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

// دالة تهيئة شريط تقدم الدروس لجميع اللغات الثلاثة
function initializeProgress() {
  // 1. مسار HTML
  var completedHTML = JSON.parse(localStorage.getItem("completedHTML")) || [];
  updateProgressForCategory('html', completedHTML, 13);

  // 2. مسار CSS
  var completedCSS = JSON.parse(localStorage.getItem("completedCSS")) || [];
  updateProgressForCategory('css', completedCSS, 8);

  // 3. مسار JavaScript
  var completedJS = JSON.parse(localStorage.getItem("completedJS")) || [];
  updateProgressForCategory('js', completedJS, 8);
}

// تحديث تقدم مسار محدد بصرياً
function updateProgressForCategory(category, completedList, totalCount) {
  var completedNumbers = completedList.map(Number);
  
  for (var i = 1; i <= totalCount; i++) {
    var progressItem = document.getElementById("progress-" + category + "-" + i);
    if (progressItem) {
      var statusEl = progressItem.querySelector(".progress-item-status");
      if (statusEl) {
        if (completedNumbers.includes(i)) {
          statusEl.textContent = "✅ مكتمل";
          statusEl.className = "progress-item-status completed";
        } else {
          statusEl.textContent = "⏳ لم يبدأ";
          statusEl.className = "progress-item-status not-started";
        }
      }
    }
  }

  var uniqueCompleted = completedNumbers.filter(function(value, index, self) {
    return self.indexOf(value) === index && value <= totalCount;
  });

  var percent = Math.round((uniqueCompleted.length / totalCount) * 100);
  
  var percentEl = document.getElementById(category + "-percent");
  var barEl = document.getElementById(category + "-bar");
  
  if (percentEl && barEl) {
    percentEl.textContent = percent + "%";
    barEl.style.width = percent + "%";
    barEl.setAttribute("aria-valuenow", percent);
  }
}

// حفظ تقدم الدرس المكتمل في LocalStorage
function markLessonAsCompleted(category, lessonId) {
  var key = "completed" + category.toUpperCase(); // completedHTML, completedCSS, completedJS
  var completedLessons = JSON.parse(localStorage.getItem(key)) || [];
  var completedNumbers = completedLessons.map(Number);
  var idNum = Number(lessonId);
  
  if (!completedNumbers.includes(idNum)) {
    completedNumbers.push(idNum);
    localStorage.setItem(key, JSON.stringify(completedNumbers));
    initializeProgress();
  }
}
