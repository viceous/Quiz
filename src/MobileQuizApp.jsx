import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import { motion } from "framer-motion";

// 📝 ЗАМЕНИТЕ НА ID своей опубликованной Google‑таблицы
const SHEET_ID = "1iwcHJliqw4JyZ6icCaEzgPQPk6r3Z1cm";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/1iwcHJliqw4JyZ6icCaEzgPQPk6r3Z1cm/gviz/tq?tqx=out:csv`;

const PER_PAGE = 10;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export default function MobileQuizApp() {
  const [rawQuestions, setRawQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState({});
  const [checkedPages, setCheckedPages] = useState({});
  const [randomOrder, setRandomOrder] = useState(false);
  const [loading, setLoading] = useState(true);

  // fetch CSV
  useEffect(() => {
    Papa.parse(SHEET_URL, {
      download: true,
      header: false,
      complete: ({ data }) => {
        const parsed = data
          .filter((r) => r[1])
          .map((r, i) => {
            const options = shuffle([r[2], ...r.slice(3).filter(Boolean)]);
            return { id: r[0] || i + 1, question: r[1], correct: r[2], options };
          });
        setRawQuestions(parsed);
        setLoading(false);
      },
    });
  }, []);

  // apply random order toggle
  useEffect(() => {
    if (!rawQuestions.length) return;
    const ordered = randomOrder ? shuffle(rawQuestions) : rawQuestions;
    setQuestions(ordered);
    setPage(0);
    setPicked({});
    setCheckedPages({});
  }, [randomOrder, rawQuestions]);

  const totalPages = useMemo(() => Math.ceil(questions.length / PER_PAGE), [questions]);
  const block = questions.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const checked = !!checkedPages[page];

  const select = (qid, ans) => setPicked((p) => ({ ...p, [qid]: ans }));
  const checkBlock = () => {
    const correct = block.filter((q) => picked[q.id] === q.correct).length;
    setCheckedPages((prev) => ({ ...prev, [page]: { correct, wrong: block.length - correct } }));
  };
  const next = () => setPage((p) => p + 1);

  const totals = Object.values(checkedPages).reduce(
    (a, b) => ({ correct: a.correct + b.correct, wrong: a.wrong + b.wrong }),
    { correct: 0, wrong: 0 }
  );
  const progress = questions.length ? Math.round(((totals.correct + totals.wrong) / questions.length) * 100) : 0;

  if (loading) return <p className="p-4 text-center">Загрузка…</p>;
  if (!questions.length) return <p className="p-4 text-center">Нет вопросов</p>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Тест</h1>
        <label className="flex items-center space-x-2 text-sm select-none">
          <input type="checkbox" checked={randomOrder} onChange={(e) => setRandomOrder(e.target.checked)} />
          <span>Случайный порядок</span>
        </label>
      </div>

      {/* progress */}
      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
        <div className="bg-blue-500 h-full" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-center">Прогресс: {progress}% • Верно: {totals.correct} • Неверно: {totals.wrong}</p>

      {/* questions */}
      {block.map((q, idx) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
          <div className="border rounded-lg p-4 mb-2 space-y-2">
            <p className="font-medium">
              {q.id}. {q.question}
            </p>
            {q.options.map((opt) => {
              const chosen = picked[q.id];
              const isCorrect = opt === q.correct;
              const correctStyle = checked && isCorrect ? "text-green-600 font-semibold" : "";
              const wrongStyle = checked && chosen === opt && !isCorrect ? "text-red-600 line-through" : "";
              return (
                <label key={opt} className={`flex items-center space-x-2 ${correctStyle} ${wrongStyle}`}>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    disabled={checked}
                    className="accent-blue-600 w-4 h-4"
                    checked={chosen === opt}
                    onChange={() => select(q.id, opt)}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* buttons */}
      {!checked ? (
        <button
          className="w-full py-2 rounded bg-blue-600 text-white disabled:opacity-40"
          disabled={block.some((q) => !picked[q.id])}
          onClick={checkBlock}
        >
          Проверить
        </button>
      ) : page < totalPages - 1 ? (
        <button className="w-full py-2 rounded bg-blue-600 text-white" onClick={next}>
          Следующие 10
        </button>
      ) : (
        <p className="text-center font-medium">Тест завершён!</p>
      )}
    </div>
  );
}
