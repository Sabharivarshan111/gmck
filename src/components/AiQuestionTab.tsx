
import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AiChat } from './AiChat';
import { Info } from 'lucide-react';

interface AiQuestionTabProps {
  question: string;
}

export const AiQuestionTab: React.FC<AiQuestionTabProps> = ({ question }) => {
  return (
    <Card className="mt-2 mb-6 border-gray-800 bg-gray-950/70 backdrop-blur-sm">
      <CardContent className="p-4">
        <Tabs defaultValue="question">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="askAi">Ask AI</TabsTrigger>
          </TabsList>
          
          <TabsContent value="question" className="text-left">
            <div className="flex items-start gap-2 p-2 bg-gray-900/50 rounded-md">
              <Info className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-200 whitespace-pre-wrap">{question}</div>
            </div>
          </TabsContent>
          
          <TabsContent value="askAi" className="max-h-[350px] overflow-y-auto">
            <div className="p-2 bg-gray-900/50 rounded-md">
              <AiChat />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
