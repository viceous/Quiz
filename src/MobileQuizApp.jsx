import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

// 📝 ЗАМЕНИТЕ НА ID своей опубликованной Google‑таблицы
const SHEET_ID = "1TWZ-hLrWVaTsj20MHTPeQ0so1u76DYDRtE-1D_jMNE4";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/1TWZ-hLrWVaTsj20MHTPeQ0so1u76DYDRtE-1D_jMNE4/gviz/tq?tqx=out:csv`;

const PER_PAGE = 10;

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export default function MobileQuizApp() {
  const [rawQuestions, setRawQuestions] = useState([]);   // исходный порядок
  const [questions, setQuestions] = useState([]);         // текущий порядок (может быть перемешан)
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState({});               // {id: answer}
  const [checkedPages, setCheckedPages] = useState({});   // {page: {correct, wrong}}
  const [randomOrder, setRandomOrder] = useState(false);
  const [loading, setLoading] = useState(true);

  // загрузка CSV один раз
  useEffect(() => {
    Papa.parse(SHEET_URL, {
      download: true,
      header: false,
      complete: ({ data }) => {
        const parsed = data
          .filter((row) => row[1])
          .map((row, idx) => {
            const variants = [row[2], ...row.slice(3).filter(Boolean)];
            return {
              id: row[0] || idx + 1,
              question: row[1],
              correct: row[2],
              options: shuffle(variants),
            };
          });
        setRawQuestions(parsed);
        setLoading(false);
      },
    });
  }, []);

  // применяем переключатель случайного порядка
  useEffect(() => {
    if (!rawQuestions.length) return;
    const newOrder = randomOrder ? shuffle(rawQuestions) : rawQuestions;
    setQuestions(newOrder);
    // сбросить прохождение при переключении
    setPage(0);
    setPicked({});
    setCheckedPages({});
  }, [randomOrder, rawQuestions]);

  const totalPages = useMemo(() => Math.ceil(questions.length / PER_PAGE), [questions]);
  const slice = questions.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleSelect = (qid, ans) => {
    setPicked((prev) => ({ ...prev, [qid]: ans }));
  };

  const handleCheck = () => {
    let correct = 0;
    slice.forEach((q) => {
      if (picked[q.id] === q.correct) correct += 1;
    });
    setCheckedPages((prev) => ({ ...prev, [page]: { correct, wrong: slice.length - correct } }));
  };

  const nextPage = () => setPage((p) => p + 1);

  // статистика
  const totals = Object.values(checkedPages).reduce(
    (acc, v) => ({ correct: acc.correct + v.correct, wrong: acc.wrong + v.wrong }),
    { correct: 0, wrong: 0 }
  );
  const answered = totals.correct + totals.wrong;
  const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  if (loading) return <p className="p-4 text-center">Загрузка…</p>;
  if (!questions.length) return <p className="p-4 text-center">Нет вопросов</p>;

  const checked = !!checkedPages[page];

  return (
    <div className="max-w-md mx-auto p-3 space-y-4">
      {/* заголовок и переключатель */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Тест</h1>
        <div className="flex items-center space-x-2">
          <Switch id="random" checked={randomOrder} onCheckedChange={setRandomOrder} />
          <label htmlFor="random" className="text-sm select-none">
            Случайный порядок
          </label>
        </div>
      </div>

      {/* прогресс */}
      <div className="space-y-1">
        <Progress value={progress} />
        <p className="text-center text-xs">Прогресс: {progress}% • Верно: {totals.correct} • Неверно: {totals.wrong}</p>
      </div>

      {/* вопросы */}
      {slice.map((q, idx) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
          <Card className="mb-2">
            <CardContent className="p-4 space-y-2">
              <p className="font-medium">{q.id}. {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt) => {
                  const chosen = picked[q.id];
                  const isCorrect = opt === q.correct;
                  const wrongPicked = checked && chosen === opt && !isCorrect;
                  const correctPicked = checked && isCorrect;
                  return (
                    <label key={opt} className={\`flex items-center space-x-2 \${correctPicked ? 'text-green-600 font-semibold' : ''} \${wrongPicked ? 'text-red-600 line-through' : ''}\`}>
                      <input
                        type="radio"
                        name={\`q-\${q.id}\`}
                        className="accent-blue-600 w-4 h-4"
                        disabled={checked}
                        checked={chosen === opt}
                        onChange={() => handleSelect(q.id, opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* кнопки */}
      {!checked ? (
        <Button disabled={slice.some((q) => !picked[q.id])} className="w-full" onClick={handleCheck}>
          Проверить
        </Button>
      ) : page < totalPages - 1 ? (
        <Button className="w-full" onClick={nextPage}>Следующие 10</Button>
      ) : (
        <p className="text-center font-medium">Тест завершён!</p>
      )}
    </div>
  );
}