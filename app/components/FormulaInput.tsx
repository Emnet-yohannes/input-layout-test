'use client';

import React, { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useFormulaStore } from '@/store';
import { useQuery } from '@tanstack/react-query';

export interface Suggestion {
  name: string;
  category: string;
  value: string | number | null;
  id: string;
  inputs?: string;
}

const AUTO_COMPLETE_URL = process.env.NEXT_PUBLIC_AUTO_COMPLETE || '';

const fetchSuggestions = async (query: string): Promise<Suggestion[]> => {
  if (!query.trim()) return [];
  const res = await fetch(`${AUTO_COMPLETE_URL}?query=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error('Error fetching suggestions');
  }
  return res.json();
};

export default function FormulaInput() {
  const { tokens, addToken, removeLastToken } = useFormulaStore();
  const [inputValue, setInputValue] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const identifyTokenType = (input: string): 'variable' | 'number' | 'operator' => {
    if (/^[+\-*/^()]+$/.test(input)) {
      return 'operator';
    } else if (/^\d+(\.\d+)?$/.test(input)) {
      return 'number';
    } else {
      return 'variable';
    }
  };
  const tokenType = identifyTokenType(inputValue.trim());

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions', inputValue],
    queryFn: () => fetchSuggestions(inputValue),
    enabled: tokenType === 'variable' && inputValue.trim().length > 0,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const tokenType = identifyTokenType(e.target.value);
    if (/^[+\-*/^()]+$/.test(e.target.value)) {
        const newToken: any = {
                    type: tokenType,
                    text: e.target.value,
                    value: tokenType === 'number' ? parseFloat(e.target.value) : undefined,
                  };
        addToken(newToken);
        setInputValue('');
      } 
      else if (/[+\-*/^()]$/.test(e.target.value)) {
        const valueWithoutOperator = e.target.value.slice(0, -1);
        const operator = e.target.value.slice(-1);
    
        if (valueWithoutOperator.trim()) {
          const valueTokenType = identifyTokenType(valueWithoutOperator.trim());
          addToken({
            type: valueTokenType,
            text: valueWithoutOperator.trim(),
            value: valueTokenType === 'number' ? parseFloat(valueWithoutOperator.trim()) : undefined,
          });
        }
    
        addToken({
          type: 'operator',
          text: operator,
          value: undefined,
        });
    
        setInputValue('');
      } 
      else{
          setInputValue(e.target.value);
      }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue!== ''  ) {
        console.log('Enter key pressed');
        const tokenType = identifyTokenType(inputValue.trim());
        addToken({
            type: tokenType,
            text: inputValue.trim(),
            value: tokenType === 'number' ? parseFloat(inputValue.trim()) : undefined,
          });
        setInputValue('');
        calculateExpression();
    } else if (e.key === 'Backspace' && inputValue === '') {
      removeLastToken();
    }
  };
  const handleSuggestionClick = (suggestion: Suggestion) => {
    const operatorMatch = inputValue.match(/[\+\-\*\/\^\(\)]$/);
    const operator = operatorMatch ? operatorMatch[0] : '';
    const tokenText = operator ? `${operator}${suggestion.name}` : suggestion.name;
    addToken({ type: 'variable', text: tokenText, value: typeof suggestion.value === 'number' ? suggestion.value : 0 });
    setInputValue('');
    inputRef.current?.focus();
  };
  

  const toggleDropdown = (index: number) => {
    setActiveDropdown((prev) => (prev === index ? null : index));
  };

  const calculateExpression = (): string | number => {
    let expression = tokens
  .map((token) => {
    if (token.type === 'number') {
      return token.value;
    } else if (token.type === 'variable') {
      return token.value !== undefined ? token.value : 0;
    } else {
      return token.text;
    }
  })
  .join(' ');

expression = expression.replace(/\s*[+\-*/^()]\s*$/, '');
    try {
      const result = eval(expression);
      return result;
    } catch (error) {
      return 'Error';
    }
  };
  

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div
        className="flex flex-wrap border p-2 rounded-md cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tokens.map((token, index) => (
            <>
             {
                token?.type === 'variable' ?
          <div
            key={index}
            className="relative bg-blue-500 text-white px-2 py-1 rounded flex items-center"
          >
           
            <span>#{token.text}</span>
            <button
              onClick={() => toggleDropdown(index)}
              className="ml-1 border-none bg-transparent cursor-pointer"
            >
              ▼
            </button>
            {activeDropdown === index && (
              <div className="absolute top-full right-0 bg-white text-black border rounded z-10 w-32 mt-1">
                <ul className="list-none p-2 m-0">
                  <li className="py-1 cursor-pointer">Edit</li>
                  <li className="py-1 cursor-pointer">Delete</li>
                </ul>
              </div>
            )}
          </div>:
          <div
          key={index}
          className='px-2 py-1 rounded flex items-center '
        >
            <span>
          {token.text}
            </span>
        </div>
        }
        </>

        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={tokens.length === 0 && inputValue.length === 0 ? "Enter formula..." : ""}
          className="flex-1 outline-none min-w-[100px]"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="border border-t-0 max-w-2xl mx-auto bg-white">
          {suggestions.map((sugg, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(sugg)}
              className="p-2 cursor-pointer border-b border-gray-200 hover:bg-gray-100"
            >
              <div className="font-semibold">{sugg.name}</div>
              <div className="text-xs text-gray-500">{sugg.category}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 font-bold">
        Result: {tokens.length ? calculateExpression() : 'N/A'}
      </div>
    </div>
  );
}