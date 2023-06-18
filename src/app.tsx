import * as React from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  updateDoc,
  where,
} from 'firebase/firestore';
import { EditIcon, InfoIcon, PlusIcon, TrashIcon, XIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { auth, db, googleAuthProvider } from './lib/firebase';
import { Loader2Icon } from 'lucide-react';
import {
  UserInfo,
  onAuthStateChanged,
  signInWithRedirect,
} from 'firebase/auth';

type Todo = {
  id: string;
  title: string;
  isDone: boolean;
  date: Date;
  userId: string;
};

const TODOS_COLLECTION = 'todos';

export function App() {
  const [date, setDate] = React.useState<Date>(new Date());
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [isAddTodo, setIsAddTodo] = React.useState<boolean>(false);
  const [editTodoId, setEditTodoId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isLoadingUser, setIsLoadingUser] = React.useState<boolean>(true);
  const [user, setUser] = React.useState<UserInfo | null>(null);

  React.useEffect(() => {
    setIsLoadingUser(true);
    const unSubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      }
      setIsLoadingUser(false);
    });

    return () => unSubscribe();
  }, []);

  React.useEffect(() => {
    if (user?.uid === undefined) return;
    setIsLoading(true);
    const q = query(
      collection(db, TODOS_COLLECTION),
      where('userId', '==', user?.uid)
    );
    const unSubscribe = onSnapshot(q, (snapshot) => {
      const todos: Todo[] = [];
      snapshot.forEach((doc) => {
        const { date, title, isDone, userId } = doc.data() as any;
        todos.push({ id: doc.id, title, isDone, userId, date: date.toDate() });
      });
      setTodos(todos);
      setIsLoading(false);
    });

    return () => unSubscribe();
  }, [user?.uid]);

  const todoDates = todos.map((todo) => todo.date);

  const handleAddTodo = () => setIsAddTodo(true);
  const handleCancelAddTodo = () => setIsAddTodo(false);

  const handleEditTodo = (id: string) => () => setEditTodoId(id);
  const handleCancelEditTodo = () => setEditTodoId(null);

  const handleDeleteTodo = (id: string) => {
    return async () => {
      try {
        await deleteDoc(doc(db, TODOS_COLLECTION, id));
      } catch (error) {
        console.error(error);
        alert('Failed to delete todo');
      }
    };
  };

  const handleToggleTodo = (id: string) => {
    return async () => {
      try {
        const todo = todos.find((todo) => todo.id === id);
        if (todo === undefined) return;

        await updateDoc(doc(db, TODOS_COLLECTION, id), {
          isDone: !todo.isDone,
        });
      } catch (error) {
        console.error(error);
        alert('Failed to delete todo');
      }
    };
  };

  const handleSubmitCreateTodo = async (event: React.FormEvent) => {
    event.preventDefault();
    const formElement = event.target as HTMLFormElement;

    const formData = new FormData(formElement);
    const title = formData.get('title') as string | undefined;

    if (!title) {
      setIsAddTodo(false);
      return;
    }

    const newTodo: Omit<Todo, 'id'> = {
      title,
      date,
      isDone: false,
      userId: user?.uid ?? '',
    };

    try {
      await addDoc(collection(db, TODOS_COLLECTION), newTodo);
    } catch (error) {
      console.error(error);
      alert('Failed to add todo');
    }

    setIsAddTodo(false);
  };

  const handleSubmitEditTodo = (id: string) => {
    return async (event: React.FormEvent) => {
      event.preventDefault();
      const formElement = event.target as HTMLFormElement;

      const formData = new FormData(formElement);
      const title = formData.get('title') as string | undefined;

      if (!title) {
        setEditTodoId(null);
        return;
      }

      try {
        await updateDoc(doc(db, TODOS_COLLECTION, id), { title });
      } catch (error) {
        console.error(error);
        alert('Failed to delete todo');
      }

      setEditTodoId(null);
    };
  };

  const handleSignIn = async () => {
    await signInWithRedirect(auth, googleAuthProvider);
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  const formatedDate = date?.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const filteredTodos = todos.filter(
    (todo) =>
      todo.date.getDate() === date.getDate() &&
      todo.date.getMonth() === date.getMonth() &&
      todo.date.getFullYear() === date.getFullYear()
  );

  if (isLoadingUser) {
    return (
      <div className="h-screen grid place-content-center p-8">
        <Loader2Icon className="mr-2 h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="h-screen grid place-content-center p-8">
        <Button variant="default" onClick={handleSignIn}>
          Masuk
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto py-16 grid grid-cols-[auto,1fr] gap-12">
      <Calendar
        modifiers={{ isTodoExist: todoDates }}
        modifiersClassNames={{
          isTodoExist:
            'after:absolute after:content-[""] after:bg-red-600 after:w-3 after:h-3 after:-top-1 after:-right-1 after:rounded-full after:border-2 after:border-white',
        }}
        mode="single"
        selected={date}
        onDayClick={(date) => setDate(date)}
        className="rounded-md border"
      />

      <main>
        <div className="flex items-center gap-2 mb-2">
          <img
            src={user.photoURL ?? undefined}
            className="w-6 h-6 rounded-full"
          />
          <p className="text-gray-500">Hi, {user.displayName}</p>
        </div>
        <header className="flex justify-between gap-8 items-center mb-6">
          <h1 className="font-bold text-3xl">{formatedDate}</h1>
          <div className="space-x-4">
            <Button variant="destructive" onClick={handleSignOut}>
              Keluar
            </Button>
          </div>
        </header>
        <ul className="space-y-2 mb-4">
          {isLoading && (
            <div className="flex justify-center p-8">
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            </div>
          )}
          {filteredTodos.length === 0 && !isAddTodo && !isLoading && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Tidak ada tugas di hari ini</AlertTitle>
              <AlertDescription className="text-gray-500">
                Tambahkan tugas kamu sekarang!
              </AlertDescription>
            </Alert>
          )}
          {filteredTodos.map((todo) => {
            const isEdit = editTodoId === todo.id;
            return (
              <li key={todo.id}>
                <article className="border rounded-md px-6 py-2 flex items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={todo.isDone}
                      onCheckedChange={handleToggleTodo(todo.id)}
                    />

                    {isEdit ? (
                      <form
                        className="w-full"
                        onSubmit={handleSubmitEditTodo(todo.id)}
                      >
                        <Input
                          name="title"
                          defaultValue={todo.title}
                          className="w-full"
                        />
                      </form>
                    ) : (
                      <span
                        className={
                          todo.isDone ? 'line-through text-gray-400' : ''
                        }
                      >
                        {todo.title}
                      </span>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          className="p-2"
                          onClick={handleDeleteTodo(todo.id)}
                        >
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
                          <Button
                            variant="secondary"
                            className="p-2"
                            onClick={handleCancelEditTodo}
                          >
                            <XIcon size={20} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Batal</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            className="p-2"
                            onClick={handleEditTodo(todo.id)}
                          >
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
                <form onSubmit={handleSubmitCreateTodo} className="w-full">
                  <Input
                    name="title"
                    placeholder="Tambahkan list kamu di sini..."
                    className="w-full"
                  />
                </form>
              </article>
            </li>
          )}
        </ul>
        {isAddTodo ? (
          <Button
            variant="outline"
            className="gap-1"
            onClick={handleCancelAddTodo}
          >
            <XIcon /> Batalkan
          </Button>
        ) : (
          <Button className="gap-1" onClick={handleAddTodo}>
            <PlusIcon /> Tambah list
          </Button>
        )}
      </main>
    </div>
  );
}
