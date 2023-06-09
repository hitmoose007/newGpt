import { Chat } from "../components/Chat";
import TodoList from "../components/Todo";
import { useState, useEffect } from "react";

function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gen, setGen] = useState(false);
  const [error, setError] = useState("");
  const [stopFetchingTasks, setStopFetchingTasks] = useState(false);
  useEffect(() => {
    const fetchTaskHistory = async () => {
      try {
        if (stopFetchingTasks) {
          return;
        }
        setLoading(true);
        const response = await fetch("/api/loadTasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            offset: offset,
          }),
        });

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json();
        if (data.results.length === 0) {
          setStopFetchingTasks(true);
        }
        data.results.forEach((item: any) => {
          setTasks((prev) => [
            ...prev,
            {
              task_id: item.task_id,
              task_name: item.task_name,
              task_completed: item.task_completed,
              subtasks: item.subtasks,
            },
          ]);
        });

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchTaskHistory();
  }, [offset]);

  const generateTasks = () => {
    setGen(true);
    setError("");
    fetch("/api/generateTasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return res.json();
      })
      .then((data) => {
        setTasks((prev) => [data.result, ...prev]);
        setGen(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Please choose an approprate task!");
        setGen(false);
      });
  };

  const handleTaskDelete = (id: number) => {
    const updatedTasks = tasks.filter((task) => task.task_id !== id);
    setTasks(updatedTasks);
    //api call to delete task
    fetch("/api/deleteTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return res.json();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const element = e.target as HTMLElement;
    //print the scroll height and scroll top
    setTimeout(() => {
      if (
        Math.floor(element.scrollHeight - element.scrollTop) ===
        element.clientHeight
      ) {
        setOffset(offset + 1);
      }
    }, 2000);
  };

  return (
    <div className='w-full h-screen flex flex-col lg:flex-row bg-zinc-200'>
      <div className='lg:w-1/2 px-2 pt-12   '>
        <span className='bg-white w-full flex rounded-t-2xl p-2 py-4 '>
          <h1 className='inline-block align-middle ml-4 font-semibold   '>
            Avatar
          </h1>
        </span>
        <Chat />
      </div>

      <div className='lg:w-1/2 px-2 pt-12  '>
        <div className='bg-white border-b border-zinc-200 w-full flex rounded-t-2xl  p-2 py-2  '>
          <button
            onClick={() => generateTasks()}
            className='bg-green-300 text-green-800 ml-4 font-bold py-2 px-4 rounded-lg flex transition-colors duration-500 ease-in-out hover:bg-green-600 hover:text-white disabled:bg-gray-200 disabled:hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:text-gray-500'
            disabled={gen}
          >
            {gen ? (
              <div
                className='w-4 h-4 mt-1 rounded-full animate-spin
              border-2 border-solid border-zinc-600 border-t-transparent'
              ></div>
            ) : (
              <svg
                preserveAspectRatio='xMidYMin'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='currentColor'
                aria-hidden='true'
                className='mt-1'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M20.5929 10.9105C21.4425 11.3884 21.4425 12.6116 20.5929 13.0895L6.11279 21.2345C5.27954 21.7033 4.24997 21.1011 4.24997 20.1451L4.24997 3.85492C4.24997 2.89889 5.27954 2.29675 6.11279 2.76545L20.5929 10.9105Z'
                ></path>
              </svg>
            )}
            <span className='px-2'>Generate Tasks</span>
          </button>
          {error !== "" && <p className='text-red-500 ml-4 mt-2'>{error}</p>}
        </div>
        <div
          className='bg-white overflow-y-scroll scrollbar-thin scrollbar-thumb-zinc-300 rounded-b-2xl max-h-[calc(100vh-7rem)] min-h-[calc(100vh-7rem)]'
          onScroll={(e) => handleScroll(e)}
        >
          {tasks.map((tasks, index) => (
            <TodoList
              key={tasks.task_id}
              data={tasks}
              handleTaskDelete={handleTaskDelete}
              index={index}
            />
          ))}
          {!loading && !stopFetchingTasks && (
            <div className='flex flex-auto flex-col justify-center items-center p-4 md:p-5'>
              <div className='flex justify-center'>
                <div
                  className='animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full'
                  role='status'
                  aria-label='loading'
                >
                  <span className='sr-only'>Loading...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
