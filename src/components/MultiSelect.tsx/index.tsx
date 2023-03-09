import {memo, Dispatch, SetStateAction} from 'react';
import {Listbox, Transition} from '@headlessui/react';

type MultiSelectPropsType = {
    options: {id: number; name: string}[];
    values: number[];
    onChange: Dispatch<SetStateAction<number[]>>;
};

const MultiSelect = (props: MultiSelectPropsType) => {
    const {options, values, onChange} = props;

    return (
        <Listbox value={values} onChange={onChange} multiple>
            {({open}) => (
                <div className="">
                    <div className="mb-2 border rounded-md border-slate-700">
                        <Listbox.Button className="w-full bg-slate-800 rounded-md px-4 h-10 text-left relative">
                            <div className="flex items-center">
                                {options
                                    ?.filter((option) => values.includes(option.id))
                                    .map((option) => (
                                        <div className="flex items-center" key={option.id}>
                                            <span className="text-slate-100">{option.name}</span>
                                            <span
                                                className="mr-2 hover:scale-110 self-baseline"
                                                onClick={() => {
                                                    onChange((prev) => prev.filter((id) => id !== option.id));
                                                }}
                                            >
                                                <svg
                                                    className="h-5 w-5 text-gray-400"
                                                    viewBox="0 0 20 20"
                                                    fill="none"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        d="M6 18L18 6M6 6l12 12"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                        </div>
                                    ))}
                            </div>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path
                                        d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        </Listbox.Button>
                    </div>
                    <Transition
                        show={open}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <div className="relative">
                            <Listbox.Options className="bg-slate-800 rounded-md absolute w-full px-1 py-1">
                                {options.map((person) => (
                                    <Listbox.Option
                                        key={person.id}
                                        value={person.id}
                                        className="cursor-pointer hover:bg-slate-700 px-4 py-1 rounded-sm"
                                    >
                                        {({selected}) => (
                                            <div className="flex items-center">
                                                {selected}
                                                <span
                                                    className={`${
                                                        selected ? 'font-semibold' : 'font-normal'
                                                    } block truncate`}
                                                >
                                                    {person.name}
                                                </span>
                                                {selected && (
                                                    <span className="text-slate-100 ml-3">
                                                        <svg
                                                            className="h-5 w-5"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </div>
                    </Transition>
                </div>
            )}
        </Listbox>
    );
};

export default memo(MultiSelect);
