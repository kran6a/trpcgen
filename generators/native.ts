export const default_import = (as: string, from: string)=>{
    return `import ${as} from "${from}";`
}
export const named_import = (as: string[], from: string)=>{
    return `import {${as.join(',')}} from "${from}";`
}

const _object_to_type = (obj: any, indent: number = 1): string=>{
    if (typeof obj !== 'object')
        return `${typeof obj}`;
    if (Array.isArray(obj)) {
        if (obj.length === 0)
            return 'Array<any>';
        return `Array<${[...new Set(obj.map((x: any) => _object_to_type(x, indent + 1))).values()].join(' | ')}>`;
    }
    if (Object.entries(obj).length === 0)
        return '{}';
    return Object.entries(obj).map(([k, v])=>[k, _object_to_type(v, indent+1)]).reduce((acc, [key, value])=>{
        return `${acc}${'    '.repeat(indent)}${key}: ${value};\n`;
    }, '{\n')+'    '.repeat(Math.max(indent-1, 0))+'}';
}

export const object = (obj: object, indent: number = 1, {shorthand}: {shorthand: boolean} = {shorthand: false}): string=>{
    if (typeof obj !== 'object')
        return `${obj}`;
    if (Array.isArray(obj)) {
        if (obj.length === 0)
            return '[]';
        return `[${obj.map(x => object(x)).join(', ')}]`;
    }
    if (Object.entries(obj).length === 0)
        return '{}';
    return Object.entries(obj).map(([k, v])=>[k, object(v, indent+1)]).reduce((acc, [key, value], i, arr)=>{
        if (shorthand && key === value)
            return `${acc}${'    '.repeat(indent)}${key}${i !== arr.length-1 ? ',':''}\n`
        return `${acc}${'    '.repeat(indent)}${key}: ${value}${i !== arr.length-1 ? ',':''}\n`;
    }, '{\n')+'    '.repeat(Math.max(indent-1, 0))+'}';
}
export const object_to_type = (name: string, obj: object)=>{
    return `type ${name} = ${_object_to_type(obj)}`;
}