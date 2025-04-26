
import React from 'react';
import { Calendar } from './ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const Booking = () => {
  return (
    <div className="py-20 bg-[#E5DEFF]/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-[#7E69AB] mb-12">Book Your Session</h2>
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Select a Date</CardTitle>
              <CardDescription>Choose your preferred massage date</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" className="rounded-md border" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Booking;
