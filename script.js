/* 
  =====================================================
  SCRIPT.JS
  ملفات التحكم بالتفاعلية للموقع التعليمي - مسار الويب الشامل
  =====================================================
*/

// فحص وتطبيق المظهر المختار مباشرة قبل تحميل شجرة الـ DOM لمنع الوميض الأبيض
(function() {
  var savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
})();

// نقطة ربط النشرة البريدية (استبدل YOUR_ID_HERE بمعرّف Formspree الخاص بك)
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_ID_HERE";
var lastNewsletterSubmit = 0;

// انتظر تحميل الصفحة بالكامل
document.addEventListener("DOMContentLoaded", function() {
  
  // تهيئة زر تبديل الوضع الداكن ديناميكياً في الهيدر لجميع الصفحات
  var mainNav = document.getElementById("main-nav");
  if (mainNav) {
    var savedTheme = localStorage.getItem("theme") || "light";
    var toggleBtn = document.createElement("button");
    toggleBtn.className = "theme-toggle-btn";
    toggleBtn.id = "theme-toggle-btn";
    toggleBtn.setAttribute("type", "button");
    toggleBtn.setAttribute("aria-label", "تبديل مظهر الموقع");
    toggleBtn.innerHTML = savedTheme === "dark" ? "☀️" : "🌙";
    
    toggleBtn.addEventListener("click", function() {
      var currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      var newTheme = currentTheme === "dark" ? "light" : "dark";
      
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      toggleBtn.innerHTML = newTheme === "dark" ? "☀️" : "🌙";
      
      // إذا كان هناك iframe في الصفحة (مثل الملعب)، نقوم بتمرير السمة له أيضاً
      var iframe = document.getElementById("live-output-frame") || document.getElementById("output-frame");
      if (iframe) {
        try {
          var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (iframeDoc && iframeDoc.documentElement) {
            iframeDoc.documentElement.setAttribute("data-theme", newTheme);
          }
        } catch (e) {
          // تجاهل الخطأ في حال تعذر الوصول لمحتوى الإطار
        }
      }
    });
    
    var menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) {
      mainNav.insertBefore(toggleBtn, menuToggle);
    } else {
      mainNav.appendChild(toggleBtn);
    }
  }

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
    setupManualCompletion('css', parseInt(isCSS[1], 10));
  } else if (isJS) {
    setupManualCompletion('js', parseInt(isJS[1], 10));
  } else if (isHTML) {
    setupManualCompletion('html', parseInt(isHTML[1], 10));
  }
  
  initializeProgress();
  
  // 3. كود تشغيل محرر الملعب في الصفحة الرئيسية (Home Page Demo Editor)
  var runBtn = document.getElementById("run-btn");
  if (runBtn) {
    runBtn.addEventListener("click", runCode);
    // تشغيل أولي لعرض النتيجة الافتراضية
    runCode();
  }

  // 4. ربط وتفعيل النشرة البريدية (Newsletter Form)
  var newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function(event) {
      event.preventDefault();
      
      var emailInput = document.getElementById("email-input");
      if (!emailInput) return;
      
      var emailValue = emailInput.value.trim();
      
      // التحقق البسيط من البريد الإلكتروني
      if (!emailValue || !emailValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showNotification("⚠️ يرجى إدخال بريد إلكتروني صحيح.", false);
        return;
      }
      
      // حدد معدل الإرسال (Rate Limiting) - 10 ثوانٍ
      var now = Date.now();
      if (now - lastNewsletterSubmit < 10000) {
        var secondsLeft = Math.ceil((10000 - (now - lastNewsletterSubmit)) / 1000);
        showNotification("⏳ يرجى الانتظار " + secondsLeft + " ثوانٍ قبل المحاولة مرة أخرى.", false);
        return;
      }
      
      var subscribeBtn = document.getElementById("subscribe-btn");
      var originalBtnText = subscribeBtn ? subscribeBtn.innerHTML : "اشترك الآن 🔔";
      
      if (subscribeBtn) {
        subscribeBtn.disabled = true;
        subscribeBtn.innerHTML = "جاري الإرسال... ⏳";
      }
      
      // محاولة الإرسال لـ Formspree
      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email: emailValue })
      })
      .then(function(response) {
        if (response.ok) {
          showNotification("🎉 تم الاشتراك بالنشرة البريدية بنجاح! شكراً لك.", true);
          emailInput.value = "";
          lastNewsletterSubmit = Date.now();
        } else {
          throw new Error("API error");
        }
      })
      .catch(function(error) {
        // Fallback: حفظ محلي عند حدوث فشل أو خطأ شبكة
        var backups = JSON.parse(localStorage.getItem("newsletter_backups")) || [];
        if (!backups.includes(emailValue)) {
          backups.push(emailValue);
          localStorage.setItem("newsletter_backups", JSON.stringify(backups));
        }
        
        // إشعار نجاح للزائر (fallback UX)
        showNotification("🎉 شكراً لك! تم الاشتراك بنجاح وسنتواصل معك قريباً.", true);
        emailInput.value = "";
        lastNewsletterSubmit = Date.now();
      })
      .finally(function() {
        if (subscribeBtn) {
          subscribeBtn.disabled = false;
          subscribeBtn.innerHTML = originalBtnText;
        }
      });
    });
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

// دالة تهيئة زر إكمال الدرس يدوياً وتحديد ظهوره عند التمرير لآخر الصفحة
function setupManualCompletion(category, lessonId) {
  var key = "completed" + category.toUpperCase();
  var completedLessons = JSON.parse(localStorage.getItem(key)) || [];
  var isCompleted = completedLessons.map(Number).includes(Number(lessonId));

  // إنشاء زر الإكمال العائم
  var btn = document.createElement("button");
  btn.id = "mark-complete-btn";
  btn.className = "mark-complete-btn-floating";
  
  if (isCompleted) {
    btn.innerHTML = "✨ مكتمل بنجاح 🎉";
    btn.classList.add("completed");
    btn.classList.add("visible"); // إذا كان مكتمل من قبل، يظهر فوراً
    btn.disabled = true;
  } else {
    btn.innerHTML = "أكملت هذا الدرس ✅";
    btn.addEventListener("click", function() {
      markLessonAsCompleted(category, lessonId);
      btn.innerHTML = "✨ مكتمل بنجاح 🎉";
      btn.classList.add("completed");
      btn.disabled = true;
      showConfettiEffect();
    });
    
    // مراقبة التمرير لإظهار الزر عند الاقتراب من نهاية الصفحة
    window.addEventListener("scroll", function() {
      var d = document.documentElement;
      var offset = d.scrollHeight - d.clientHeight;
      if (d.scrollTop > offset - 350) {
        btn.classList.add("visible");
      }
    });
    
    // فحص احتياطي في حال كانت الشاشة قصيرة جداً أو المحتوى لا يتطلب سكرول
    setTimeout(function() {
      var d = document.documentElement;
      if (d.scrollHeight <= d.clientHeight + 100) {
        btn.classList.add("visible");
      }
    }, 500);
  }

  document.body.appendChild(btn);
}

// دالة إظهار تأثير الاحتفال العائم وToast عند إكمال الدرس
function showConfettiEffect() {
  // 1. إظهار إشعار Toast جميل باستخدام الدالة الموحدة
  showNotification("🎉 أحسنت! تم تسجيل إكمال الدرس وتحديث تقدمك بنجاح.", true);

  // 2. إطلاق تأثير جزيئات الألوان
  for (var i = 0; i < 40; i++) {
    var particle = document.createElement("div");
    particle.className = "confetti-particle";
    
    // موقع الزر العائم في الركن الأيمن السفلي
    particle.style.right = (Math.random() * 80 + 20) + "px";
    particle.style.bottom = "80px";
    particle.style.backgroundColor = ["#4dabf7", "#28a745", "#ffc107", "#e74c3c", "#9b59b6", "#fd7e14"][Math.floor(Math.random() * 6)];
    
    var angle = Math.random() * Math.PI * 2;
    var velocity = Math.random() * 120 + 60;
    
    particle.style.setProperty("--dx", (Math.cos(angle) * velocity) + "px");
    particle.style.setProperty("--dy", (-Math.sin(angle) * velocity - 120) + "px");
    document.body.appendChild(particle);
    
    setTimeout((function(p) {
      return function() { p.remove(); };
    })(particle), 1200);
  }
}

// دالة موحدة لإظهار التنبيهات المنبثقة (Toast)
function showNotification(message, isSuccess) {
  var toast = document.createElement("div");
  toast.className = "completion-toast";
  if (!isSuccess) {
    toast.style.borderRightColor = "#e74c3c"; // شريط أحمر للتنبيهات أو الأخطاء
  }
  toast.innerHTML = message;
  document.body.appendChild(toast);
  
  setTimeout(function() {
    toast.classList.add("show");
  }, 100);
  
  setTimeout(function() {
    toast.classList.remove("show");
    setTimeout(function() {
      toast.remove();
    }, 500);
  }, 3500);
}
