'use client'

import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Canvas from './Canvas'
import EditableComponent from './EditableComponent'

interface EditorCanvasProps {
  viewMode: 'desktop' | 'mobile' | 'tablet'
  editedHtml: string
  components: any[]
  onUpdateComponent: (id: string, newData: any) => void
  onDeleteComponent: (id: string) => void
  onSelectComponent: (component: any) => void
  onAddComponent?: (type: string, dropTarget?: HTMLElement) => void
  onElementSelect?: (element: HTMLElement) => void
  customCss?: string
}

const EditorCanvas = ({
  viewMode,
  editedHtml,
  components,
  onUpdateComponent,
  onDeleteComponent,
  onSelectComponent,
  onAddComponent,
  onElementSelect,
  customCss
}: EditorCanvasProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onElementSelectRef = useRef<EditorCanvasProps['onElementSelect']>(onElementSelect);
  const onAddComponentRef = useRef<EditorCanvasProps['onAddComponent']>(onAddComponent);
  const editedHtmlRef = useRef<string>(editedHtml);
  const isEditingRef = useRef<boolean>(false);

  useEffect(() => { onElementSelectRef.current = onElementSelect; }, [onElementSelect]);
  useEffect(() => { onAddComponentRef.current = onAddComponent; }, [onAddComponent]);
  useEffect(() => { editedHtmlRef.current = editedHtml; }, [editedHtml]);

  useEffect(() => {
    const setupIframeHandlers = () => {
      const iframe = iframeRef.current;
      
      if (iframe?.contentDocument) {
        const doc = iframe.contentDocument;
        
        // Add styles to iframe head
        doc.head.innerHTML = `
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: system-ui;
            }
            .editor-component {
              border: 2px dashed #e0e0e0 !important;
              border-radius: 8px !important;
              position: relative;
              margin: 10px 0;
            }
            .editor-component:hover { border-color: #3b82f6 !important; }
            .selected-element {
              outline: 2px solid #8b5cf6 !important;
              outline-offset: 2px !important;
              background-color: rgba(139, 92, 246, 0.05) !important;
              z-index: 1000;
              position: relative;
            }
            /* Ensure images display properly */
            img { max-width: 100%; height: auto; display: block; }
            /* Make contenteditable elements more visible when focused */
            [contenteditable] {
              padding: 4px 6px;
              border-radius: 4px;
              min-width: 20px;
              display: inline-block;
            }
            [contenteditable]:focus {
              outline: 2px solid #8b5cf6 !important;
              outline-offset: 2px !important;
            }
            /* Don't override background color for buttons and links when focused */
            button[contenteditable]:focus,
            a[contenteditable]:focus {
              background-color: inherit !important;
            }
            /* Prevent accidental style changes during text selection */
            [contenteditable] ::selection {
              background-color: rgba(139, 92, 246, 0.3) !important;
              color: inherit !important;
            }
            [contenteditable]::-moz-selection {
              background-color: rgba(139, 92, 246, 0.3) !important;
              color: inherit !important;
            }
            /* Completely disable all pseudo content for contenteditable elements */
            [contenteditable]:empty:before,
            [contenteditable]:empty:after,
            [contenteditable]::before,
            [contenteditable]::after {
              content: none !important;
              display: none !important;
            }
            /* Prevent any automatic text insertion */
            [contenteditable] * {
              -webkit-user-modify: read-write-plaintext-only !important;
            }
            /* Disable button and link navigation in edit mode */
            button, a[href] {
              pointer-events: auto !important;
              cursor: default !important;
            }
            button:hover, a[href]:hover {
              cursor: pointer !important;
            }
            /* Ensure buttons and links are editable */
            button[contenteditable="true"], a[contenteditable="true"] {
              pointer-events: auto !important;
              cursor: text !important;
            }
            /* Special handling for buttons and links with data-editable-link */
            [data-editable-link="true"] {
              pointer-events: auto !important;
            }
            [data-editable-link="true"]:focus,
            [data-editable-link="true"][contenteditable="true"]:focus {
              cursor: text !important;
              outline: 2px solid #8b5cf6 !important;
              outline-offset: 2px !important;
            }
            /* Prevent drag handle from being contenteditable */
            .ve-drag-handle {
              pointer-events: auto !important;
              user-select: none !important;
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
            }
            .ve-drag-handle[contenteditable] {
              contenteditable: false !important;
            }
            /* Prevent drag conflicts with editable elements */
            [contenteditable] img { pointer-events: none; }

            /* Resize handles */
            .ve-resize-handle { position: absolute; width: 10px; height: 10px; background: #8b5cf6; border: 2px solid #fff; border-radius: 50%; z-index: 9999; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
            .ve-resize-handle.se { right: -6px; bottom: -6px; cursor: se-resize; }
            .ve-resize-handle.ne { right: -6px; top: -6px; cursor: ne-resize; }
            .ve-resize-handle.sw { left: -6px; bottom: -6px; cursor: sw-resize; }
            .ve-resize-handle.nw { left: -6px; top: -6px; cursor: nw-resize; }
            .ve-resize-handle.e { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
            .ve-resize-handle.w { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
            .ve-resize-handle.s { left: 50%; bottom: -6px; transform: translateX(-50%); cursor: s-resize; }
            .ve-resize-handle.n { left: 50%; top: -6px; transform: translateX(-50%); cursor: n-resize; }

            .ve-drag-handle { position: absolute; left: 50%; top: -18px; transform: translateX(-50%); padding: 2px 4px; font-size: 12px; background: #8b5cf6; color: #fff; border-radius: 4px; user-select: none; cursor: grab; z-index: 9999; pointer-events: auto !important; line-height: 1; font-weight: bold; }
          </style>
          <style id="ve-custom-css">${customCss || ''}</style>
        `;
        
        // Ensure initial content is rendered once without triggering re-init later
        if (!doc.body.innerHTML) {
          doc.body.innerHTML = editedHtmlRef.current || '';
        }
        
        // Utility: Get closest selectable element
        const selectableSelector = 'div, section, header, footer, article, aside, main, nav, p, h1, h2, h3, h4, h5, h6, ul, ol, li, figure, figcaption, blockquote, button, a, img, span, [data-editable-link]';
        const isHandle = (el: Element | null) => !!(el as HTMLElement | null)?.classList?.contains('ve-drag-handle') || !!(el as HTMLElement | null)?.classList?.contains('ve-resize-handle');
        const getClosestSelectable = (start: Element | null) => {
          if (!start) return null;
          if (isHandle(start)) return null;
          // First check if the element itself is selectable
          const element = start as HTMLElement;
          if (element.matches && element.matches(selectableSelector)) {
            return element;
          }
          return element.closest(selectableSelector) as HTMLElement | null;
        };

        // Clear all existing handles
        const clearHandles = () => {
          doc.querySelectorAll('.ve-resize-handle, .ve-drag-handle').forEach(h => h.remove());
        };

        // Produce clean HTML without editor-only artifacts
        const getCleanHtml = () => {
          const clone = doc.body.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('.ve-resize-handle, .ve-drag-handle').forEach(h => h.remove());
          clone.querySelectorAll('.selected-element').forEach(el => el.classList.remove('selected-element'));
          // Remove any data-placeholder attributes that might have been added
          clone.querySelectorAll('[data-placeholder]').forEach(el => el.removeAttribute('data-placeholder'));
          // Clean up any unwanted placeholder text that might have been inserted
          clone.querySelectorAll('[contenteditable]').forEach((el: any) => {
            const text = el.textContent || '';
            const innerHTML = el.innerHTML || '';
            // Remove various forms of placeholder text and unwanted characters
            const placeholderTexts = [
              'Type here...', 'Enter title...', 'Click to edit...',
              'Type here', 'Enter title', 'susus', 'Type here...'
            ];
            
            placeholderTexts.forEach(placeholder => {
              if (text.trim() === placeholder || innerHTML.trim() === placeholder) {
                el.textContent = '';
              }
              // Remove partial matches that might have been inserted
              if (text.includes(placeholder) && text.length < placeholder.length + 10) {
                el.textContent = text.replace(placeholder, '').trim();
              }
            });
            
            // Remove unwanted special characters like "::" that might appear
            if (text.includes('::') && text.length < 20) {
              el.textContent = text.replace('::', '').trim();
            }
            
            // Remove webkit-user-modify style
            (el.style as any).webkitUserModify = '';
          });
          return clone.innerHTML;
        };

        // Add resize + drag handles to an element
        const addHandles = (el: HTMLElement) => {
          if (!el || el.querySelector('.ve-resize-handle.se')) return;

          const se = doc.createElement('div'); se.className = 've-resize-handle se';
          const ne = doc.createElement('div'); ne.className = 've-resize-handle ne';
          const sw = doc.createElement('div'); sw.className = 've-resize-handle sw';
          const nw = doc.createElement('div'); nw.className = 've-resize-handle nw';
          const eH = doc.createElement('div'); eH.className = 've-resize-handle e';
          const wH = doc.createElement('div'); wH.className = 've-resize-handle w';
          const sH = doc.createElement('div'); sH.className = 've-resize-handle s';
          const nH = doc.createElement('div'); nH.className = 've-resize-handle n';
          const drag = doc.createElement('div'); drag.className = 've-drag-handle';
          // Use Unicode drag icon instead of text
          drag.innerHTML = '⋮⋮';
          // Ensure drag handle is never contenteditable
          drag.setAttribute('contenteditable', 'false');
          drag.style.pointerEvents = 'auto';
          drag.style.userSelect = 'none';
          (drag.style as any).webkitUserSelect = 'none';
          (drag.style as any).mozUserSelect = 'none';
          (drag.style as any).msUserSelect = 'none';

          el.appendChild(se); el.appendChild(ne); el.appendChild(sw); el.appendChild(nw); el.appendChild(eH); el.appendChild(wH); el.appendChild(sH); el.appendChild(nH); el.appendChild(drag);

          let startX = 0, startY = 0, startW = 0, startH = 0;
          const beginResize = (evt: MouseEvent, mode: 'se'|'ne'|'sw'|'nw'|'e'|'w'|'s'|'n') => {
            evt.preventDefault();
            startX = evt.clientX; startY = evt.clientY; startW = el.clientWidth; startH = el.clientHeight;
            const isImage = el.tagName === 'IMG' || !!el.querySelector('img');
            const minW = isImage ? 50 : 100; const minH = isImage ? 50 : 80;

            const move = (e2: MouseEvent) => {
              const dx = e2.clientX - startX; const dy = e2.clientY - startY;
              let newW = startW; let newH = startH;
              if (mode === 'e') newW = startW + dx;
              if (mode === 'w') newW = startW - dx;
              if (mode === 's') newH = startH + dy;
              if (mode === 'n') newH = startH - dy;
              if (mode === 'se') { newW = startW + dx; newH = startH + dy; }
              if (mode === 'ne') { newW = startW + dx; newH = startH - dy; }
              if (mode === 'sw') { newW = startW - dx; newH = startH + dy; }
              if (mode === 'nw') { newW = startW - dx; newH = startH - dy; }

              // Maintain aspect ratio for images when shift pressed
              if (isImage && (evt as any).shiftKey) {
                const aspect = startW / startH;
                if (mode.includes('e') || mode.includes('w')) newH = newW / aspect;
                else if (mode.includes('n') || mode.includes('s')) newW = newH * aspect;
              }

              (el as any).style.width = Math.max(minW, newW) + 'px';
              (el as any).style.height = Math.max(minH, newH) + 'px';
            };

            const up = () => {
              doc.removeEventListener('mousemove', move);
              doc.removeEventListener('mouseup', up);
              const rect = el.getBoundingClientRect();
              (el as any).style.width = rect.width + 'px';
              (el as any).style.height = rect.height + 'px';
              // Notify parent
              const event = new CustomEvent('contentChange', { detail: { html: getCleanHtml() } });
              window.dispatchEvent(event);
            };

            doc.addEventListener('mousemove', move);
            doc.addEventListener('mouseup', up);
          };

          se.addEventListener('mousedown', (e: any) => beginResize(e, 'se'));
          ne.addEventListener('mousedown', (e: any) => beginResize(e, 'ne'));
          sw.addEventListener('mousedown', (e: any) => beginResize(e, 'sw'));
          nw.addEventListener('mousedown', (e: any) => beginResize(e, 'nw'));
          eH.addEventListener('mousedown', (e: any) => beginResize(e, 'e'));
          wH.addEventListener('mousedown', (e: any) => beginResize(e, 'w'));
          sH.addEventListener('mousedown', (e: any) => beginResize(e, 's'));
          nH.addEventListener('mousedown', (e: any) => beginResize(e, 'n'));

          // Drag handle enables internal drag
          const dragStartHandler = (e: DragEvent) => {
            (e.dataTransfer as DataTransfer).setData('internal-drag', 'true');
            (e.dataTransfer as DataTransfer).effectAllowed = 'move';
            // Stash globally on doc so we can move exact element on drop
            (doc as any)._dragEl = el;
          };
          const dragEndHandler = () => { /* cleanup handled on drop */ };

          drag.addEventListener('pointerdown', (evt: any) => {
            evt.preventDefault();
            (el as any).draggable = true; (el as any).style.opacity = '0.7'; (el as any).style.cursor = 'grabbing';
            el.addEventListener('dragstart', dragStartHandler);
            el.addEventListener('dragend', dragEndHandler);
          });
          drag.addEventListener('dblclick', () => {
            (el as any).style.width = '100%'; (el as any).style.height = 'auto';
            const event = new CustomEvent('contentChange', { detail: { html: getCleanHtml() } });
            window.dispatchEvent(event);
          });
        };

        // Click selection handler
        const handleClick = (e: Event) => {
          const target = e.target as HTMLElement;
          const candidate = getClosestSelectable(target);
          
          // Prevent default navigation for buttons and links in edit mode
          if (target.tagName.toLowerCase() === 'button' || 
              target.tagName.toLowerCase() === 'a' ||
              target.closest('button') || 
              target.closest('a')) {
            e.preventDefault();
            e.stopPropagation();
          }

          // Clear previous selections and handles
          doc.querySelectorAll('.selected-element').forEach((el: any) => el.classList.remove('selected-element'));
          clearHandles();

          if (candidate) {
            candidate.classList.add('selected-element');
            addHandles(candidate);
            // Inline edit for text-like elements (but not drag handles)
            const tag = candidate.tagName.toLowerCase();
            const textLike = ['p','h1','h2','h3','h4','h5','h6','span','button','a'];
            const isDragHandle = candidate.classList.contains('ve-drag-handle');
            const isResizeHandle = candidate.classList.contains('ve-resize-handle');
            const hasEditableLink = candidate.hasAttribute('data-editable-link');
            
            if ((textLike.includes(tag) || hasEditableLink) && !isDragHandle && !isResizeHandle) {
              // Remove any data-placeholder to prevent unwanted placeholders
              candidate.removeAttribute('data-placeholder');
              
              // Store original content before making contenteditable
              const originalContent = candidate.innerHTML;
              
              if (!candidate.hasAttribute('contenteditable')) {
                candidate.setAttribute('contenteditable','true');
                // Prevent unwanted behavior only for non-links
                if (tag !== 'a') {
                  (candidate.style as any).webkitUserModify = 'read-write-plaintext-only';
                }
              }
              
              // Restore content if it was modified unexpectedly
              setTimeout(() => {
                const currentContent = candidate.innerHTML;
                if (currentContent !== originalContent && 
                    (currentContent.includes('Type here') || 
                     currentContent.includes('Enter title') ||
                     currentContent.includes('Click to edit'))) {
                  candidate.innerHTML = originalContent;
                }
              }, 10);
              
              // Protect drag and resize handles inside this element
              const handles = candidate.querySelectorAll('.ve-drag-handle, .ve-resize-handle');
              handles.forEach((handle: any) => {
                handle.setAttribute('contenteditable', 'false');
                handle.style.pointerEvents = 'auto';
                handle.style.userSelect = 'none';
              });
              
              // Remove existing listeners to prevent duplicates
              const existingHandler = (candidate as any)._veContentHandler;
              if (existingHandler) {
                candidate.removeEventListener('input', existingHandler);
                candidate.removeEventListener('blur', existingHandler);
              }
              
              // Attach change listeners
              const handleContentChange = (e: Event) => {
                const event = new CustomEvent('contentChange', { detail: { html: getCleanHtml() } });
                window.dispatchEvent(event);
              };
              (candidate as any)._veContentHandler = handleContentChange;
              candidate.addEventListener('input', handleContentChange);
              candidate.addEventListener('blur', handleContentChange);
              
              // Focus and place caret at end
              try {
                candidate.focus();
                const range = doc.createRange();
                range.selectNodeContents(candidate);
                range.collapse(false);
                const sel = iframe.contentWindow?.getSelection?.();
                sel?.removeAllRanges();
                sel?.addRange(range);
              } catch {}
            }
            onElementSelectRef.current?.(candidate);
          }
        };

        // Content change from contenteditable
        const handleContentChange = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.hasAttribute('contenteditable')) {
            // Check for unwanted text and remove it
            const text = target.textContent || '';
            const unwantedTexts = ['Type here...', 'Enter title...', 'Click to edit...', 'susus', '::'];
            
            let shouldClean = false;
            unwantedTexts.forEach(unwanted => {
              if (text.includes(unwanted)) {
                target.textContent = text.replace(unwanted, '').trim();
                shouldClean = true;
              }
            });
            
            // Special handling for "::" characters that might appear as icons
            if (text.includes('::') && text !== '::' && text.length > 2) {
              target.textContent = text.replace(/::+/g, '').trim();
              shouldClean = true;
            }
            
            clearTimeout((window as any).contentUpdateTimer);
            (window as any).contentUpdateTimer = setTimeout(() => {
              const event = new CustomEvent('contentChange', { detail: { html: getCleanHtml() } });
              window.dispatchEvent(event);
            }, shouldClean ? 100 : 500);
          }
        };

        // Track editing focus state
        const handleFocusIn = (e: FocusEvent) => {
          const t = e.target as HTMLElement;
          if (t && t.hasAttribute('contenteditable')) {
            isEditingRef.current = true;
          }
        };
        const handleFocusOut = (e: FocusEvent) => {
          const t = e.target as HTMLElement;
          if (t && t.hasAttribute('contenteditable')) {
            setTimeout(() => { isEditingRef.current = false; }, 0);
          }
        };

        // Add input listeners to existing contenteditable
        const editableElements = doc.querySelectorAll('[contenteditable]');
        editableElements.forEach(el => {
          el.addEventListener('input', handleContentChange);
          el.addEventListener('blur', handleContentChange);
        });

        // ALT+Drag to reorder any element
        const handleAltMouseDown = (e: MouseEvent) => {
          if (!(e as any).altKey) return;
          const target = e.target as HTMLElement;
          const draggableElement = getClosestSelectable(target);
          if (!draggableElement) return;
          e.preventDefault();
          (draggableElement as any).draggable = true;
          draggableElement.style.opacity = '0.7';
          draggableElement.style.cursor = 'grabbing';
          const onDragStart = (ev: DragEvent) => {
            (ev.dataTransfer as DataTransfer).setData('internal-drag', 'true');
            (ev.dataTransfer as DataTransfer).effectAllowed = 'move';
            (doc as any)._dragEl = draggableElement;
          };
          const onDragEnd = () => {
            (draggableElement as any).draggable = false;
            draggableElement.style.opacity = '';
            draggableElement.style.cursor = '';
            draggableElement.removeEventListener('dragstart', onDragStart);
            draggableElement.removeEventListener('dragend', onDragEnd);
          };
          draggableElement.addEventListener('dragstart', onDragStart);
          draggableElement.addEventListener('dragend', onDragEnd);
        };

        // Drag over for internal/external drops
        const handleDragOver = (e: DragEvent) => {
          e.preventDefault();
          const dt = e.dataTransfer as DataTransfer | null;
          if (!dt) return;
          if (dt.types.includes('internal-drag')) {
            dt.dropEffect = 'move';
            const target = e.target as HTMLElement;
            const dropTarget = getClosestSelectable(target);
            if (dropTarget && !(dropTarget as any).draggable) {
              // Clear previous indicators
              doc.querySelectorAll('[style*="border-top"]').forEach((el: any) => { (el as HTMLElement).style.borderTop = ''; });
              (dropTarget as HTMLElement).style.borderTop = '3px solid #8b5cf6';
            }
          } else {
            dt.dropEffect = 'copy';
            doc.body.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
            doc.body.style.border = '3px dashed #8b5cf6';
          }
        };

        const handleDragLeave = (e: DragEvent) => {
          if (!doc.body.contains(e.relatedTarget as Node)) {
            doc.body.style.backgroundColor = '';
            doc.body.style.border = '';
          }
        };

        const handleDrop = (e: DragEvent) => {
          e.preventDefault();
          const dt = e.dataTransfer as DataTransfer | null;
          if (!dt) return;
          // Clear visuals
          doc.body.style.backgroundColor = '';
          doc.body.style.border = '';
          doc.querySelectorAll('[style*="border-top"]').forEach((el: any) => { (el as HTMLElement).style.borderTop = ''; });

          if (dt.types.includes('internal-drag')) {
            const sourceEl = (doc as any)._dragEl as HTMLElement | null;
            const target = e.target as HTMLElement;
            const dropTarget = getClosestSelectable(target);
            if (sourceEl && dropTarget && sourceEl !== dropTarget) {
              try {
                dropTarget.parentNode?.insertBefore(sourceEl, dropTarget);
              } catch (err) {
                // fallback append
                doc.body.appendChild(sourceEl);
              }
              const event = new CustomEvent('contentChange', { detail: { html: getCleanHtml() } });
              window.dispatchEvent(event);
            }
            (doc as any)._dragEl = null;
          } else {
            const componentType = dt.getData('component-type');
            if (componentType && onAddComponentRef.current) {
              const dropTarget = e.target as HTMLElement;
              onAddComponentRef.current(componentType, dropTarget);
            }
          }
        };

        // Delete selected element with Delete key
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Delete') {
            const selected = doc.querySelector('.selected-element') as HTMLElement | null;
            if (selected) {
              e.preventDefault();
              const elementName = selected.tagName.toLowerCase();
              const elementText = selected.textContent?.substring(0, 50) || 'element';
              const truncated = elementText.length > 50 ? elementText + '...' : elementText;
              if (confirm(`Are you sure you want to delete this ${elementName} element?\n\n"${truncated}"`)) {
                selected.remove();
                clearHandles();
                const event = new CustomEvent('contentChange', { detail: { html: getCleanHtml() } });
                window.dispatchEvent(event);
              }
            }
          }
        };

        // Register listeners
        doc.addEventListener('click', handleClick);
        doc.body.addEventListener('mousedown', handleAltMouseDown);
        doc.addEventListener('dragover', handleDragOver);
        doc.addEventListener('dragleave', handleDragLeave);
        doc.addEventListener('drop', handleDrop);
        doc.addEventListener('keydown', handleKeyDown);
        doc.addEventListener('focusin', handleFocusIn as any);
        doc.addEventListener('focusout', handleFocusOut as any);

        // Clean up
        return () => {
          doc.removeEventListener('click', handleClick);
          doc.body.removeEventListener('mousedown', handleAltMouseDown);
          doc.removeEventListener('dragover', handleDragOver);
          doc.removeEventListener('dragleave', handleDragLeave);
          doc.removeEventListener('drop', handleDrop);
          doc.removeEventListener('keydown', handleKeyDown);
          doc.removeEventListener('focusin', handleFocusIn as any);
          doc.removeEventListener('focusout', handleFocusOut as any);
          editableElements.forEach(el => {
            el.removeEventListener('input', handleContentChange);
            el.removeEventListener('blur', handleContentChange);
          });
          clearHandles();
        };
      }
    };

    // Set up handlers after a short delay to ensure iframe is loaded
    const timer = setTimeout(setupIframeHandlers, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Sync editedHtml into iframe when it changes, but avoid clobbering while editing or when identical (cleaned)
  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;
    if (isEditingRef.current) return;

    const clone = doc.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.ve-resize-handle, .ve-drag-handle').forEach(h => h.remove());
    clone.querySelectorAll('.selected-element').forEach(el => el.classList.remove('selected-element'));
    const currentClean = clone.innerHTML;

    if ((editedHtml || '') !== currentClean) {
      doc.body.innerHTML = editedHtml || '';
    }
  }, [editedHtml]);

  // Update custom CSS dynamically without re-initializing handlers
  useEffect(() => {
    const styleEl = iframeRef.current?.contentDocument?.getElementById('ve-custom-css') as HTMLStyleElement | null;
    if (styleEl) {
      styleEl.textContent = customCss || '';
    }
  }, [customCss]);
 
   return (
     <Box sx={{ p: 2 }}>
       <Canvas className="min-h-[60vh]" onAddComponent={onAddComponent}>
        {/* Always render the iframe with edited HTML so drops merge into existing page */}
        {true ? (
          <Box sx={{ 
            width: '100%', 
            height: '150vh', 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            pt: 2,
            bgcolor: 'background.default',
            transition: 'all 0.3s ease',
            overflowX: 'hidden'
          }}>
            <Box sx={{
              width: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '1200px',
              maxWidth: '100%',
              height: '100%',
              mx: 'auto',
              border: viewMode !== 'desktop' ? '1px solid' : 'none',
              borderColor: viewMode !== 'desktop' ? 'divider' : 'transparent',
              borderRadius: viewMode !== 'desktop' ? 2 : 0,
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              <iframe 
                ref={iframeRef}
                title="Landing Page Editor"
                src="about:blank"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 'inherit'
                }}
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {components.map((component) => (
              <EditableComponent
                key={component.id}
                component={component}
                onUpdate={(newData) => onUpdateComponent(component.id, newData)}
                onDelete={() => onDeleteComponent(component.id)}
                onSelect={(comp) => onSelectComponent(comp)}
              />
            ))}
          </Box>
        )}
      </Canvas>
    </Box>
  )
}

export default EditorCanvas