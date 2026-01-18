"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { parseScenesFromFountain, type Scene } from "@/lib/scripts/fountainParser";
import {
  extractCharacterNames,
  classifyLine,
  transformLine,
  detectIntentForLine,
  nextLineIndentAfter,
  INDENT,
  type ElementType,
} from "@/lib/scripts/fountainSmart";
import { computeCursorContext, type CursorContext } from "@/lib/scripts/editorContext";
import { SceneSidebar } from "@/components/editor/SceneSidebar";

interface EditorClientProps {
  scriptId: string;
  initialTitle: string;
  initialFountain: string;
}

export function EditorClient({
  scriptId,
  initialTitle,
  initialFountain,
}: EditorClientProps) {
  const [title, setTitle] = useState(initialTitle);
  const [fountain, setFountain] = useState(initialFountain);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number | undefined>();
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "agent"; content: string; createdAt?: string }>>([]);
  const [userMessage, setUserMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [cursorLine, setCursorLine] = useState<number>(1);
  const [cursorColumn, setCursorColumn] = useState<number>(1);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [writerProfile, setWriterProfile] = useState<{
    tone: string;
    focus: string;
    avoidTheme: boolean;
    avoidSymbolism: boolean;
  } | null>(null);
  const [agentStyle, setAgentStyle] = useState<"director" | "socratic">("director");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completionProviderRef = useRef<monaco.IDisposable | null>(null);
  const enterKeyDisposableRef = useRef<monaco.IDisposable | null>(null);
  const router = useRouter();

  useEffect(() => {
    const parsedScenes = parseScenesFromFountain(fountain);
    setScenes(parsedScenes);
  }, [fountain]);

  // Load thread history on mount
  useEffect(() => {
    const loadThread = async () => {
      try {
        const response = await fetch(`/api/agent/thread?scriptId=${scriptId}`);
        if (response.ok) {
          const data = await response.json();
          setThreadId(data.threadId);
          setWriterProfile(data.writerProfile);
          if (data.messages && data.messages.length > 0) {
            setChatMessages(
              data.messages.map((msg: { role: string; content: string; createdAt: string }) => ({
                role: msg.role === "user" ? "user" : "agent",
                content: msg.content,
                createdAt: msg.createdAt,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Failed to load thread:", error);
      }
    };
    loadThread();
  }, [scriptId]);

  useEffect(() => {
    if (!editorInstance) return;

    const updateSelection = () => {
      const selection = editorInstance.getSelection();
      if (selection && !selection.isEmpty()) {
        const model = editorInstance.getModel();
        if (model) {
          const text = model.getValueInRange(selection);
          setSelectedText(text);
        }
      } else {
        setSelectedText("");
      }
    };

    const cursorDisposable = editorInstance.onDidChangeCursorPosition((e) => {
      const currentLine = e.position.lineNumber;
      const currentColumn = e.position.column;
      setCursorLine(currentLine);
      setCursorColumn(currentColumn);
      const activeScene = scenes
        .slice()
        .reverse()
        .find((scene) => scene.startLine <= currentLine);
      setActiveSceneIndex(activeScene?.index);
      updateSelection();
    });

    const selectionDisposable = editorInstance.onDidChangeCursorSelection(() => {
      updateSelection();
    });

    return () => {
      cursorDisposable.dispose();
      selectionDisposable.dispose();
    };
  }, [editorInstance, scenes]);

  // Re-register Enter handler when autoFormat changes
  useEffect(() => {
    if (!editorInstance) return;

    // Dispose previous handler
    if (enterKeyDisposableRef.current) {
      enterKeyDisposableRef.current.dispose();
    }

    // Register Enter keybinding for auto-formatting
    enterKeyDisposableRef.current = editorInstance.onKeyDown((e) => {
      if (e.keyCode !== monaco.KeyCode.Enter) return;
      if (!autoFormat) return; // Skip if auto-format is disabled

      const selection = editorInstance.getSelection();
      if (!selection || !selection.isEmpty()) {
        return; // Let default behavior handle selections
      }

      const model = editorInstance.getModel();
      if (!model) return;

      const lineNumber = selection.startLineNumber;
      const line = model.getLineContent(lineNumber);
      const trimmed = line.trim();

      // If line is empty, allow normal Enter
      if (trimmed.length === 0) {
        return;
      }

      // Detect intent and format the current line
      const intent = detectIntentForLine(trimmed);
      const formattedLine = transformLine(line, intent);
      const nextIndent = nextLineIndentAfter(intent);

      // Always apply formatting and insert newline with proper indentation
      e.preventDefault();
      e.stopPropagation();

      const newLineIndent = " ".repeat(nextIndent);

      // Replace current line with formatted version and insert newline with indentation
      const lineEnd = line.length + 1;
      editorInstance.executeEdits("auto-format-enter", [
        {
          range: {
            startLineNumber: lineNumber,
            endLineNumber: lineNumber,
            startColumn: 1,
            endColumn: lineEnd,
          },
          text: formattedLine + "\n" + newLineIndent,
        },
      ]);

      // Set cursor position after indentation on new line
      editorInstance.setPosition({
        lineNumber: lineNumber + 1,
        column: nextIndent + 1,
      });
      editorInstance.focus();
    });

    return () => {
      if (enterKeyDisposableRef.current) {
        enterKeyDisposableRef.current.dispose();
      }
    };
  }, [editorInstance, autoFormat]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
      if (enterKeyDisposableRef.current) {
        enterKeyDisposableRef.current.dispose();
      }
    };
  }, []);

  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    setEditorInstance(editor);

    // Register completion provider (only once)
    if (!completionProviderRef.current) {
      const provider = monaco.languages.registerCompletionItemProvider("plaintext", {
        provideCompletionItems: (model, position) => {
          const line = model.getLineContent(position.lineNumber);
          const lineUntilCursor = line.substring(0, position.column - 1);
          const suggestions: monaco.languages.CompletionItem[] = [];

          // Get current fountain text from the model
          const currentFountain = model.getValue();

          // Scene heading suggestions
          const upperLineUntil = lineUntilCursor.toUpperCase();
          if (upperLineUntil.startsWith("INT") || upperLineUntil.startsWith("EXT")) {
            const sceneSuggestions = [
              "INT. LOCATION - DAY",
              "INT. LOCATION - NIGHT",
              "EXT. LOCATION - DAY",
              "EXT. LOCATION - NIGHT",
              "INT./EXT. LOCATION - DAY",
            ];
            sceneSuggestions.forEach((suggestion) => {
              suggestions.push({
                label: suggestion,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: suggestion,
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: 1,
                  endColumn: position.column,
                },
              });
            });
          }

          // Character name suggestions
          const currentElementType = classifyLine(line);
          if (currentElementType === "character" || lineUntilCursor === lineUntilCursor.toUpperCase()) {
            const characterNames = extractCharacterNames(currentFountain);
            characterNames.forEach((name) => {
              suggestions.push({
                label: name,
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: name,
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: 1,
                  endColumn: position.column,
                },
              });
            });
          }

          return { suggestions };
        },
      });
      completionProviderRef.current = provider;
    }

    // Register Tab keybinding for element type cycling
    // Use a keybinding that only triggers when there's no selection
    editor.addCommand(
      monaco.KeyCode.Tab,
      () => {
        const selection = editor.getSelection();
        if (!selection || !selection.isEmpty()) {
          // Don't override Tab for multi-line selections - let default behavior handle it
          return false;
        }

        const model = editor.getModel();
        if (!model) return false;

        const lineNumber = selection.startLineNumber;
        const line = model.getLineContent(lineNumber);
        const currentType = classifyLine(line);

        // Cycle order: action -> character -> dialogue -> parenthetical -> transition -> scene -> action
        const cycleOrder: ElementType[] = [
          "action",
          "character",
          "dialogue",
          "parenthetical",
          "transition",
          "scene",
        ];
        const currentIndex = cycleOrder.indexOf(currentType);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % cycleOrder.length : 0;
        const nextType = cycleOrder[nextIndex];

        const transformed = transformLine(line, nextType);

        // Apply edit
        editor.executeEdits("cycle-element-type", [
          {
            range: {
              startLineNumber: lineNumber,
              endLineNumber: lineNumber,
              startColumn: 1,
              endColumn: line.length + 1,
            },
            text: transformed,
          },
        ]);

        // Adjust cursor position
        let newColumn: number;
        if (nextType === "dialogue") {
          // Place cursor after dialogue indentation
          newColumn = INDENT.dialogue + 1;
        } else if (nextType === "parenthetical") {
          // Place cursor inside parentheses (after opening paren and indentation)
          newColumn = INDENT.parenthetical + 2;
        } else if (nextType === "character") {
          // Place cursor after character indentation
          newColumn = INDENT.character + 1;
        } else if (nextType === "transition") {
          // Place cursor after transition indentation
          newColumn = INDENT.transition + 1;
        } else {
          // Scene or action: place at end of line or column 1 if empty
          newColumn = transformed.length > 0 ? transformed.length + 1 : 1;
        }

        editor.setPosition({ lineNumber, column: newColumn });
        editor.focus();
        return true; // Indicate we handled the command
      },
      "editorTextFocus && !editorReadonly && !hasMultipleSelections && !hasNonEmptySelection"
    );
  };

  const handleSelectScene = (scene: Scene) => {
    if (!editorInstance) return;

    editorInstance.revealLineInCenter(scene.startLine);
    editorInstance.setPosition({ lineNumber: scene.startLine, column: 1 });
    editorInstance.focus();
  };

  const getCurrentSceneText = (): { text: string; slugline?: string } => {
    if (!editorInstance || scenes.length === 0) {
      return { text: fountain };
    }

    const currentLine = editorInstance.getPosition()?.lineNumber || 1;
    const activeScene = scenes
      .slice()
      .reverse()
      .find((scene) => scene.startLine <= currentLine);

    if (!activeScene) {
      return { text: fountain };
    }

    const lines = fountain.split("\n");
    const startLine = activeScene.startLine - 1; // 0-based
    const nextScene = scenes.find((s) => s.startLine > activeScene.startLine);
    const endLine = nextScene ? nextScene.startLine - 1 : lines.length;

    const sceneText = lines.slice(startLine, endLine).join("\n");
    return { text: sceneText, slugline: activeScene.slugline };
  };

  const askAgent = async (mode: "selection" | "scene" | "profile", customUserMessage?: string) => {
    if (!editorInstance && mode !== "profile") return;

    setIsLoading(true);
    const sceneData = getCurrentSceneText();

    // Compute cursor context
    const cursorContext = computeCursorContext({
      fountain,
      lineNumber: cursorLine,
      column: cursorColumn,
      scenes,
    });

    // For selection mode, determine element type from selection start
    let selectionElementType: ElementType | undefined;
    if (mode === "selection" && selectedText && editorInstance) {
      const selection = editorInstance.getSelection();
      if (selection) {
        const model = editorInstance.getModel();
        if (model) {
          const startLine = model.getLineContent(selection.startLineNumber);
          selectionElementType = classifyLine(startLine);
        }
      }
    }

    const messageToSend = customUserMessage || userMessage.trim() || undefined;

    try {
      const response = await fetch("/api/agent/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId,
          mode,
          selectionText: mode === "selection" ? selectedText : undefined,
          sceneText: sceneData.text,
          sceneSlugline: sceneData.slugline,
          userMessage: messageToSend,
          cursorContext,
          elementType: mode === "selection" ? selectionElementType : cursorContext.elementType,
          style: agentStyle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get questions");
      }

      const data = await response.json();
      const questions = data.questions;

      // Update profile if returned
      if (data.writerProfile) {
        setWriterProfile(data.writerProfile);
      }

      // Reload thread to get updated messages
      const threadResponse = await fetch(`/api/agent/thread?scriptId=${scriptId}`);
      if (threadResponse.ok) {
        const threadData = await threadResponse.json();
        if (threadData.messages && threadData.messages.length > 0) {
          setChatMessages(
            threadData.messages.map((msg: { role: string; content: string; createdAt: string }) => ({
              role: msg.role === "user" ? "user" : "agent",
              content: msg.content,
              createdAt: msg.createdAt,
            }))
          );
        }
      }

      setUserMessage("");
    } catch (error) {
      console.error("Agent error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: `Error: ${error instanceof Error ? error.message : "Failed to get questions"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!userMessage.trim()) return;
    askAgent("scene", userMessage.trim());
  };

  const handlePersonalize = () => {
    askAgent("profile", "I want to personalize: ask me about my writing style and what kind of questions help me.");
  };

  const save = async (titleValue: string, fountainValue: string) => {
    setSaveStatus("saving");

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleValue,
          fountain: fountainValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSaveStatus("saved");
      router.refresh();
    } catch (error) {
      setSaveStatus("error");
      console.error("Save error:", error);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      save(newTitle, fountain);
    }, 2000);
  };

  const handleFountainChange = (newFountain: string | undefined) => {
    if (newFountain === undefined) return;
    
    setFountain(newFountain);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      save(title, newFountain);
    }, 2000);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="bg-transparent text-2xl font-black uppercase tracking-widest text-yellow-500 outline-none placeholder:text-gray-600"
          placeholder="SCRIPT TITLE"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400">
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="rounded border-gray-800 bg-black/50 accent-yellow-500"
            />
            <span>Auto-format</span>
          </label>
          <div className="text-xs font-medium uppercase tracking-widest text-gray-500">
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && "Error saving"}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <SceneSidebar
          scenes={scenes}
          activeSceneIndex={activeSceneIndex}
          onSelectScene={handleSelectScene}
        />
        <div className="flex-1 overflow-hidden rounded border border-gray-800">
          <Editor
            height="calc(100vh - 12rem)"
            language="plaintext"
            value={fountain}
            onChange={handleFountainChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              wordWrap: "off",
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Courier Prime', 'Courier New', monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              lineNumbers: "on",
              renderWhitespace: "none",
              tabSize: 2,
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                useShadows: false,
                horizontalScrollbarSize: 10,
                verticalScrollbarSize: 10,
              },
            }}
          />
        </div>
        <div className="flex h-full w-[380px] flex-col border-l border-gray-800 bg-black/50 backdrop-blur-sm">
          <div className="border-b border-gray-800 p-4">
            <h2 className="text-lg font-black uppercase tracking-widest text-yellow-500">
              Writing Coach
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setAgentStyle("director")}
                className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-widest transition-all ${
                  agentStyle === "director"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-yellow-500"
                }`}
              >
                Director Mode
              </button>
              <button
                onClick={() => setAgentStyle("socratic")}
                className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-widest transition-all ${
                  agentStyle === "socratic"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-yellow-500"
                }`}
              >
                Strict Socratic
              </button>
            </div>
            {writerProfile && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-medium uppercase tracking-widest text-gray-400">
                  Tone: {writerProfile.tone}
                </span>
                <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-medium uppercase tracking-widest text-gray-400">
                  Focus: {writerProfile.focus}
                </span>
                {writerProfile.avoidTheme && (
                  <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-medium uppercase tracking-widest text-gray-400">
                    No theme
                  </span>
                )}
                {writerProfile.avoidSymbolism && (
                  <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-medium uppercase tracking-widest text-gray-400">
                    No symbolism
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 border-b border-gray-800 p-4">
            <div className="flex gap-2">
              <button
                onClick={() => askAgent("selection")}
                disabled={!selectedText || isLoading}
                className="flex-1 rounded bg-yellow-500 px-3 py-2 text-xs font-bold uppercase tracking-widest text-black transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:opacity-50 hover:scale-105 hover:bg-yellow-400 active:scale-95"
              >
                Discuss selection
              </button>
              <button
                onClick={() => askAgent("scene")}
                disabled={isLoading}
                className="flex-1 rounded bg-yellow-500 px-3 py-2 text-xs font-bold uppercase tracking-widest text-black transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:opacity-50 hover:scale-105 hover:bg-yellow-400 active:scale-95"
              >
                Discuss scene
              </button>
            </div>
            <button
              onClick={handlePersonalize}
              disabled={isLoading}
              className="rounded border-2 border-yellow-500 px-3 py-2 text-xs font-bold uppercase tracking-widest text-yellow-500 transition-all disabled:border-gray-800 disabled:text-gray-600 disabled:opacity-50 hover:bg-yellow-500 hover:text-black active:scale-95"
            >
              Personalize
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your answer or question..."
                className="flex-1 rounded border border-gray-800 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-yellow-500"
              />
              <button
                onClick={handleSend}
                disabled={!userMessage.trim() || isLoading}
                className="rounded bg-yellow-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:opacity-50 hover:scale-105 hover:bg-yellow-400 active:scale-95"
              >
                Send
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {chatMessages.length === 0 ? (
              <div className="text-xs font-medium uppercase tracking-widest text-gray-500">
                Ask questions about your selection or scene to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded border p-3 ${
                      msg.role === "user"
                        ? "border-yellow-500/30 bg-yellow-500/10 text-white"
                        : "border-gray-800 bg-black/50 text-gray-200"
                    }`}
                  >
                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-yellow-500">
                      {msg.role === "user" ? "You" : "Agent"}
                    </div>
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  </div>
                ))}
                {isLoading && (
                  <div className="rounded border border-gray-800 bg-black/50 p-3 text-xs font-medium uppercase tracking-widest text-gray-500">
                    Thinking...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
