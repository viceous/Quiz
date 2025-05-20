import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import { motion } from "framer-motion";

// 📝 Замените на ID своей Google‑таблицы
const SHEET_ID = "1iwcHJliqw4JyZ6icCaEzgPQPk6r3Z1cm";
// Лист 1: Questions  |  Лист 2: Groups
const QUESTIONS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Questions`;
const GROUPS_URL    = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Groups`;

const PER_PAGE = 10;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export default function MobileQuizApp() {
  /* ---------- state ---------- */
  const [rawQuestions, setRawQuestions] = useState([]); // полный список
  const [groups, setGroups]           = useState([]);   // [{name,ranges:[[1,184],[200,210]]}]
  const [questions, setQuestions]     = useState([]);   // отфильтрованный список под тест

  // UI‑состояния
  const [phase, setPhase]             = useState("select"); // select | quiz | done
  const [selectedGroup, setSelected]  = useState("ALL");
  const [randomOrder, setRandom]      = useState(false);
  const [loading, setLoading]         = useState(true);

  // тестовые счётчики
  const [page, setPage]               = useState(0);
  const [picked, setPicked]           = useState({});   // {id: answer}
  const [checkedPages, setChecked]    = useState({});   // {page:{correct,wrong}}

  /* ---------- загрузка CSV ---------- */
  useEffect(() => {
    // Загружаем вопросы
    const loadQuestions = new Promise((resolve) => {
      Papa.parse(QUESTIONS_URL, {
        download: true,
        header: false,
        complete: ({ data }) => {
          const parsed = data
            .filter((r) => r[1])
            .map((r, i) => ({
              id: Number(r[0] || i + 1), // строка или индекс
              question: r[1],
              correct: r[2],
              options: shuffle([r[2], ...r.slice(3).filter(Boolean)]),
            }));
          setRawQuestions(parsed);
          resolve();
        },
      });
    });

    // Загружаем группы
    const loadGroups = new Promise((resolve) => {
      Papa.parse(GROUPS_URL, {
        download: true,
        header: false,
        complete: ({ data }) => {
          // формат: Имя ; 1-184,200-210 …
          const parsed = data
            .filter((r) => r[0])
            .map((r) => {
              const ranges = String(r[1] || "")
                .split(/[,;]/)
                .map((rg) => rg.trim())
                .filter(Boolean)
                .map((rg) => {
                  const [s, e] = rg.split("-").map(Number);
                  return [s, e || s];
                });
              return { name: r[0], ranges };
            });
          setGroups(parsed);
          resolve();
        },
      });
    });

    Promise.all([loadQuestions, loadGroups]).then(() => setLoading(false));
  }, []);

  /* ---------- helper ---------- */
  const resetTestState = () => {
    setPage(0);
    setPicked({});
    setChecked({});
  };

  /* ---------- старт теста ---------- */
  const startQuiz = () => {
    let filtered = rawQuestions;
    if (selectedGroup !== "ALL") {
      const grp = groups.find((g) => g.name === selectedGroup);
      if (grp) {
        filtered = rawQuestions.filter((q) => grp.ranges.some(([s, e]) => q.id >= s && q.id <= e));
      }
    }
    if (randomOrder) filtered = shuffle(filtered);
    setQuestions(filtered);
    resetTestState();
    setPhase("quiz");
  };

  /* ---------- логика викторины ---------- */
  const block = questions.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const checked = !!checkedPages[page];

  const selectOpt = (qid, ans) => setPicked((p) => ({ ...p, [qid]: ans }));

  const checkBlock = () => {
    const correct = block.filter((q) => picked[q.id] === q.correct).length;
    setChecked((prev) => ({ ...prev, [page]: { correct, wrong: block.length - correct } }));
  };

  const nextPage = () => setPage((p) => p + 1);

  /* ---------- статистика ---------- */
  const totals = Object.values(checkedPages).reduce((a, b) => ({ correct: a.correct + b.correct, wrong: a.wrong + b.wrong }), { correct: 0, wrong: 0 });
  const progress = questions.length ? Math.round(((totals.correct + totals.wrong) / questions.length) * 100) : 0;

  /* ---------- UI ---------- */
  if (loading) return <p className="p-4 text-center">Загрузка…</p>;

  // ---------- экран выбора раздела ----------
  if (phase === "select") {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-xl font-bold text-center">Выберите раздел</h1>

        <label className="flex items-center space-x-2">
          <input type="radio" name="group" value="ALL" checked={selectedGroup === "ALL"} onChange={() => setSelected("ALL")}/> <span>Все разделы</span>
        </label>
        {groups.map((g) => (
          <label key={g.name} className="flex items-center space-x-2">
            <input type="radio" name="group" value={g.name} checked={selectedGroup === g.name} onChange={() => setSelected(g.name)}/> <span>{g.name}</span>
          </label>
        ))}

        <label className="flex items-center space-x-2 pt-4">
          <input type="checkbox" checked={randomOrder} onChange={(e) => setRandom(e.target.checked)} />
          <span>Случайный порядок вопросов</span>
        </label>

        <button className="w-full py-2 mt-4 rounded bg-blue-600 text-white" onClick={startQuiz}>Начать тест</button>
      </div>
    );
  }

  // ---------- экран викторины ----------
  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <button onClick={() => setPhase("select")} className="text-sm text-blue-600 underline">← К разделам</button>
        <h2 className="font-semibold">Раздел: {selectedGroup === "ALL" ? "Все" : selectedGroup}</h2>
      </div>

      {/* progress */}
      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
        <div className="bg-blue-500 h-full" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-center">Прогресс: {progress}% • Верно: {totals.correct} • Неверно: {totals.wrong}</p>

      {/* вопросы */}
      {block.map((q, idx) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
          <div className="border rounded-lg p-4 mb-2 space-y-2">
            <p className="font-medium">{q.id}. {q.question}</p>
            {q.options.map((opt) => {
              const chosen = picked[q.id];
              const isCorrect = opt === q.correct;
              const correctStyle = checked && isCorrect ? "text-green-600 font-semibold" : "";
              const wrongStyle = checked && chosen === opt && !isCorrect ? "text-red-600 line-through" : "";
              return (
                <label key={opt} className={`flex items-center space-x-2 ${correctStyle} ${wrongStyle}`}>
                  <input type="radio" name={`q-${q.id}`} disabled={checked} className="accent-blue-600 w-4 h-4" checked={chosen === opt} onChange={() => selectOpt(q.id, opt)} />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* кнопки */}
      {!checked ? (
        <button className="w-full py-2 rounded bg-blue-600 text-white disabled:opacity-40" disabled={block.some((q) => !picked[q.id])} onClick={checkBlock}>Проверить</button>
      ) : page < Math.ceil(questions.length / PER_PAGE) - 1 ? (
        <button className="w-full py-2 rounded bg-blue-600 text-white" onClick={nextPage}>Следующие 10</button>
      ) : (
        <p className="text-center font-medium">Тест завершён!</p>
      )}
    </div>
  );
}
