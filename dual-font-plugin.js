/**
 * draw.io 桌面版双字体插件
 * 
 * This plugin implements an advanced font formatting system that:
 * - Applies SimSun font to Chinese characters
 * - Applies Times New Roman to non-Chinese characters 
 * - Handles mixed Chinese/non-Chinese text within the same elements
 */

// Plugin registration function
function registerDualFontPlugin(ui) {
  if (!ui) return;

  // 检测字符串是否包含 HTML 标签
  function containsHtml(text) {
    return /<[a-z][\s\S]*>/i.test(text);
  }

  // 解析 HTML 并应用字体
  function processHtmlContent(html) {
    // 创建一个临时 DOM 元素来解析 HTML
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 递归处理所有文本节点
    function processNode(node) {
      if (node.nodeType === 3) { // 文本节点
        // 处理文本节点
        var text = node.textContent;
        if (!text.trim()) return; // 跳过空文本
        
        // 检查是否包含中文
        var hasChinese = /[\u4e00-\u9fa5]/.test(text);
        var hasNonChinese = /[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uff60\uff61-\uffef]/.test(text);
        
        // 如果混合了中英文，拆分处理
        if (hasChinese && hasNonChinese) {
          var parent = node.parentNode;
          var currentPosition = 0;
          var segments = [];
          var currentType = null;
          var currentText = '';
          
          // 字符分类
          for (var i = 0; i < text.length; i++) {
            var char = text[i];
            var isChinese = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uff60\uff61-\uffef]/.test(char);
            
            if (currentType === null) {
              currentType = isChinese;
              currentText = char;
            } else if (currentType === isChinese) {
              currentText += char;
            } else {
              segments.push({text: currentText, isChinese: currentType});
              currentType = isChinese;
              currentText = char;
            }
          }
          
          // 添加最后一段
          if (currentText) {
            segments.push({text: currentText, isChinese: currentType});
          }
          
          // 用分段替换原节点
          segments.forEach(function(segment) {
            var span = document.createElement('span');
            span.style.fontFamily = segment.isChinese ? 'SimSun' : 'Times New Roman';
            span.textContent = segment.text;
            parent.insertBefore(span, node);
          });
          
          // 移除原文本节点
          parent.removeChild(node);
          
        } else if (hasChinese) {
          // 纯中文
          var span = document.createElement('span');
          span.style.fontFamily = 'SimSun';
          span.textContent = text;
          node.parentNode.replaceChild(span, node);
        } else if (hasNonChinese) {
          // 纯非中文
          var span = document.createElement('span');
          span.style.fontFamily = 'Times New Roman';
          span.textContent = text;
          node.parentNode.replaceChild(span, node);
        }
      } else if (node.nodeType === 1) { // 元素节点
        // 保留现有的字体设置
        var existingFont = node.style && node.style.fontFamily;
        
        // 递归处理子节点
        Array.from(node.childNodes).forEach(processNode);
      }
    }
    
    // 处理所有内容
    processNode(tempDiv);
    
    // 返回处理后的 HTML
    return tempDiv.innerHTML;
  }

  // 应用双字体格式化
  function applyDualFontFormatting(cell, graph) {
    if (!cell || !graph) return;
    
    var model = graph.getModel();
    var cellValue = model.getValue(cell);
    var label = '';
    
    // 获取标签文本
    if (typeof cellValue === 'string') {
      label = cellValue;
    } else if (cellValue && typeof cellValue === 'object' && cellValue.getAttribute) {
      label = cellValue.getAttribute('label') || '';
    } else {
      return;
    }
    
    if (!label) return;
    
    // 检查标签是否已经包含 HTML
    if (containsHtml(label)) {
      // 处理含有 HTML 的内容
      var processedHtml = processHtmlContent(label);
      
      // 创建 XML 对象以设置值
      var doc = mxUtils.createXmlDocument();
      var obj = doc.createElement('object');
      obj.setAttribute('label', processedHtml);
      
      // 更新单元格值
      model.beginUpdate();
      try {
        model.setValue(cell, obj);
        graph.setCellStyles('html', '1', [cell]);
      } finally {
        model.endUpdate();
      }
    } else {
      // 处理纯文本内容
      var hasChinese = /[\u4e00-\u9fa5]/.test(label);
      var hasNonChinese = /[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uff60\uff61-\uffef]/.test(label);
      
      if (hasChinese && hasNonChinese) {
        // 混合内容 - 将其转换为 HTML
        var styledText = '';
        var currentType = null;
        var currentSegment = '';
        
        for (var i = 0; i < label.length; i++) {
          var char = label[i];
          var isChinese = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uff60\uff61-\uffef]/.test(char);
          
          if (currentType === null) {
            currentType = isChinese;
            currentSegment = char;
          } else if (currentType === isChinese) {
            currentSegment += char;
          } else {
            var fontFamily = currentType ? 'SimSun' : 'Times New Roman';
            styledText += '<span style="font-family: ' + fontFamily + ';">' + 
                         escapeHtml(currentSegment) + '</span>';
            currentType = isChinese;
            currentSegment = char;
          }
        }
        
        // 添加最后一段
        if (currentSegment) {
          var fontFamily = currentType ? 'SimSun' : 'Times New Roman';
          styledText += '<span style="font-family: ' + fontFamily + ';">' + 
                       escapeHtml(currentSegment) + '</span>';
        }
        
        // 创建 XML 对象以设置值
        var doc = mxUtils.createXmlDocument();
        var obj = doc.createElement('object');
        obj.setAttribute('label', styledText);
        
        // 更新单元格值
        model.beginUpdate();
        try {
          model.setValue(cell, obj);
          graph.setCellStyles('html', '1', [cell]);
        } finally {
          model.endUpdate();
        }
      } else if (hasChinese) {
        // 纯中文内容
        graph.setCellStyles('fontFamily', 'SimSun', [cell]);
      } else {
        // 非中文内容
        graph.setCellStyles('fontFamily', 'Times New Roman', [cell]);
      }
    }
  }
  
  // HTML 转义函数
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  
  // Helper function to format text segments with appropriate font
  function formatSegment(text, isChinese) {
    // Escape HTML special characters properly
    var escaped = text.replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&#39;');
    
    // Apply font-family based on text type
    var fontFamily = isChinese ? 'SimSun' : 'Times New Roman';
    
    // Use proper mxGraph HTML format
    return '<font face="' + fontFamily + '">' + escaped + '</font>';
  }


  // Register action for manual triggering
  ui.actions.addAction('dualFontFormat', function() {
    // Get the current graph
    var editor = ui.editor;
    if (!editor || !editor.graph) {
      console.error('Editor or graph not available');
      return;
    }
    
    var graph = editor.graph;
    
    // Start a single compound edit for undo/redo functionality
    graph.getModel().beginUpdate();
    try {
      // Get all cells in the graph
      var cells = graph.getChildCells(graph.getDefaultParent());
      
      // Process each cell
      for (var i = 0; i < cells.length; i++) {
        applyDualFontFormatting(cells[i], graph);
      }
    } finally {
      // End the compound edit
      graph.getModel().endUpdate();
    }
    
    // Show confirmation message
    ui.alert('已应用双字体格式化: 中文使用宋体(SimSun), 非中文使用 Times New Roman');
  }, null, null, 'Ctrl+Shift+D');
  
  // Add the action to the Edit menu
  var editMenu = ui.menus.get('edit');
  var oldCallback = editMenu.funct;
  
  editMenu.funct = function(menu, parent) {
    // Call the original function
    if (oldCallback != null) {
      oldCallback.apply(this, arguments);
    }
    
    // Add separator
    menu.addSeparator(parent);
    
    // Add our menu item
    ui.menus.addMenuItem(menu, 'dualFontFormat', parent);
  };

  // Add auto-formatting for new cells
  if (ui.editor && ui.editor.graph) {
    var graph = ui.editor.graph;
    
    if (graph.labelChanged) {
      var oldLabelChanged = graph.labelChanged;
      
      graph.labelChanged = function(cell, value, autoSize) {
        // Call the original function first
        oldLabelChanged.apply(this, arguments);
        
        // Apply dual font formatting
        applyDualFontFormatting(cell, this);
      };
    }
  }
  
  // Auto-run the formatting for all existing elements when diagram is loaded
  if (ui.editor) {
    if (ui.editor.addListener) {
      ui.editor.addListener('fileLoaded', function() {
        // Delayed execution to ensure diagram is fully loaded
        setTimeout(function() {
          if (ui.actions && ui.actions.get) {
            var action = ui.actions.get('dualFontFormat');
            if (action && action.funct) {
              action.funct();
            }
          }
        }, 500);
      });
    }
  }
  
  console.log('Dual Font Plugin loaded successfully (SimSun for Chinese, Times New Roman for non-Chinese)');
}

// 使用适合 Electron 环境的模块模式
(function() {
  // 等待应用程序完全初始化
  function initPlugin() {
    if (typeof Draw === 'undefined' || !Draw.loadPlugin) {
      // 如果 Draw 未就绪，等待并重试
      setTimeout(initPlugin, 100);
      return;
    }

    // 当 Draw.io 就绪时注册插件
    Draw.loadPlugin(function(ui) {
    registerDualFontPlugin(ui);
      console.log('双字体插件成功加载');
    });
  }

  // 开始初始化过程
  initPlugin();
})();

