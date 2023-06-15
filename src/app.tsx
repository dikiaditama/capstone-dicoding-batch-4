import * as React from 'react';
import { CheckIcon, EditIcon, InfoIcon, PlusIcon, TrashIcon, XIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from './components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';

type Todo = {
  id: number;
  title: string;
  isDone: boolean;
  date: Date;
};

const initializeTodo = (JSON.parse(localStorage.getItem('todos') ?? '[]') as Todo[]).map((todo) => ({ ...todo, date: new Date(todo.date) }));
export function App() {
  const [date, setDate] = React.useState<Date>(new Date());
  const [todos, setTodos] = React.useState<Todo[]>(initializeTodo);
  const [isAddTodo, setIsAddTodo] = React.useState<boolean>(false);
  const [editTodoId, setEditTodoId] = React.useState<number | null>(null);

  const todoDates = todos.map((todo) => todo.date);

  const handleAddTodo = () => setIsAddTodo(true);
  const handleCancelAddTodo = () => setIsAddTodo(false);

  const handleEditTodo = (id: number) => () => setEditTodoId(id);
  const handleCancelEditTodo = () => setEditTodoId(null);

  const handleDeleteTodo = (id: number) => {
    return () => {
      const deletedTodo = todos.filter((todo) => todo.id !== id);
      setTodos(deletedTodo);
      localStorage.setItem('todos', JSON.stringify(deletedTodo));
    };
  };

  const handleToggleTodo = (id: number) => {
    return () => {
      const clearTodo = todos.map((todo) => {
        if (todo.id === id) {
          return {
            ...todo,
            isDone: !todo.isDone,
          };
        }
        return todo;
      });
      setTodos(clearTodo);
      localStorage.setItem('todos', JSON.stringify(clearTodo));
    };
  };

  const handleSubmitTodo = (event: React.FormEvent) => {
    event.preventDefault();
    const formElement = event.target as HTMLFormElement;

    const formData = new FormData(formElement);
    const title = formData.get('title') as string | undefined;

    if (!title) {
      setIsAddTodo(false);
      return;
    }

    const newTodo: Todo = {
      id: +new Date(),
      title,
      date,
      isDone: false,
    };

    setTodos((prev) => [...prev, newTodo]);
    const exsistingTodo = JSON.parse(localStorage.getItem('todos') ?? '[]') as Todo[];
    exsistingTodo.push(newTodo);
    localStorage.setItem('todos', JSON.stringify(exsistingTodo));

    setIsAddTodo(false);
  };

  const handleSubmitEditTodo = (id: number) => {
    return (event: React.FormEvent) => {
      event.preventDefault();
      const formElement = event.target as HTMLFormElement;

      const formData = new FormData(formElement);
      const title = formData.get('title') as string | undefined;

      if (!title) {
        setEditTodoId(null);
        return;
      }

      const editTodo = todos.map((todo) => {
        if (todo.id === id) {
          return {
            ...todo,
            title: title,
          };
        }
        return todo;
      });
      setTodos(editTodo);
      localStorage.setItem('todos', JSON.stringify(editTodo));

      setEditTodoId(null);
    };
  };

  const formatedDate = date?.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const filteredTodos = todos.filter((todo) => todo.date.getDate() === date.getDate() && todo.date.getMonth() === date.getMonth() && todo.date.getFullYear() === date.getFullYear());

  return (
    <div className="max-w-screen-lg mx-auto py-16 grid grid-cols-[auto,1fr] gap-12">
      <Calendar
        modifiers={{ isTodoExist: todoDates }}
        modifiersClassNames={{
          isTodoExist: 'after:absolute after:content-[""] after:bg-red-600 after:w-3 after:h-3 after:-top-1 after:-right-1 after:rounded-full after:border-2 after:border-white',
        }}
        mode="single"
        selected={date}
        onDayClick={(date) => setDate(date)}
        className="rounded-md border"
      />

      <div>
        <h1 className="font-bold text-3xl mb-6">{formatedDate}</h1>
        <ul className="space-y-2 mb-4">
          {filteredTodos.length === 0 && !isAddTodo && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Tidak ada tugas di hari ini</AlertTitle>
              <AlertDescription className="text-gray-500">Tambahkan tugas kamu sekarang!</AlertDescription>
            </Alert>
          )}
          {filteredTodos.map((todo) => {
            const isEdit = editTodoId === todo.id;
            return (
              <li key={todo.id}>
                <article className="border rounded-md px-6 py-2 flex items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox checked={todo.isDone} onCheckedChange={handleToggleTodo(todo.id)} />

                    {isEdit ? (
                      <form className="w-full" onSubmit={handleSubmitEditTodo(todo.id)}>
                        <Input name="title" defaultValue={todo.title} className="w-full" />
                      </form>
                    ) : (
                      <span className={todo.isDone ? 'line-through text-gray-400' : ''}>{todo.title}</span>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="secondary" className="p-2" onClick={handleDeleteTodo(todo.id)}>
                          <TrashIcon size={20} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Hapus</p>
                      </TooltipContent>
                    </Tooltip>

                    {isEdit ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="secondary" className="p-2" onClick={handleCancelEditTodo}>
                            <CheckIcon size={20} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selesai</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="secondary" className="p-2" onClick={handleEditTodo(todo.id)}>
                            <EditIcon size={20} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </article>
              </li>
            );
          })}

          {isAddTodo && (
            <li>
              <article className="border rounded-md p-4 flex items-center gap-3">
                <form onSubmit={handleSubmitTodo} className="w-full">
                  <Input name="title" placeholder="Tambahkan list kamu di sini..." className="w-full" />
                </form>
              </article>
            </li>
          )}
        </ul>
        {isAddTodo ? (
          <Button variant="outline" className="gap-1" onClick={handleCancelAddTodo}>
            <XIcon /> Batalkan
          </Button>
        ) : (
          <Button className="gap-1" onClick={handleAddTodo}>
            <PlusIcon /> Tambah list
          </Button>
        )}
      </div>
    </div>
  );
}
