import task, {type TaskAPI} from 'tasuku';

class Task<const O extends Promise<any>>{
    private readonly _task: ()=>Promise<TaskAPI<O>>;
    constructor(public title: string, fn: (opts?: {setTitle: (title: string)=>void})=>O) {
        this._task = async ()=>await task<O>(this.title, fn);
    }
    run(): Promise<TaskAPI<O>>{
        return this._task();
    }
}

export default class TaskService{
    public static async task<O extends Promise<any>>(title: string, fn: (opts?: {setTitle: (title: string)=>void})=>O){
        return new Task(title, fn);
    }
}