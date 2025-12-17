import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, getCurrentUser } from '../services/mockData';
import { Course, User } from '../types';
import { Card, Button, Badge } from '../components/UI';
import { Calendar, Clock, BookOpen, ArrowRight, PlayCircle } from 'lucide-react';
import { SEO } from '../components/SEO';

export const Training: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const data = await getCourses();
      setCourses(data);
      setCurrentUser(getCurrentUser());
    };
    loadData();
  }, []);

  const isEnrolled = (courseId: string) => {
      return currentUser?.enrolledCourses?.includes(courseId);
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title="Training Academy - Master Digital Skills" 
        description="Enroll in intensive online bootcamps and courses. Learn web development, graphic design, and digital marketing."
        keywords="online courses, web development training, graphic design course, learn coding, nexlify academy"
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#1E1F20] py-20 border-b border-[#444746]">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#9B72CB] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge color="purple">Nexlify Academy</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mt-6 mb-6 text-[#E3E3E3]">Master Digital Skills</h1>
          <p className="text-xl text-[#C4C7C5] max-w-3xl mx-auto mb-10">
            Intensive online bootcamps designed to launch your career in Web Development and Graphic Design.
          </p>
        </div>
      </div>

      {/* Course List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-10">
          {courses.map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
                <Card key={course.id} className={`flex flex-col h-full hoverEffect p-0 overflow-hidden group ${enrolled ? 'ring-2 ring-[#6DD58C] ring-offset-2 ring-offset-[#131314]' : ''}`}>
                <div className="relative h-64 overflow-hidden">
                    <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131314] via-transparent to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-[#131314]/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#A8C7FA] border border-[#444746]">
                    {course.level}
                    </div>
                    {enrolled && (
                        <div className="absolute bottom-4 left-4 bg-[#6DD58C] text-[#0F5223] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <PlayCircle className="w-3 h-3 fill-current" /> Active
                        </div>
                    )}
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-sm text-[#8E918F] mb-4">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-[#A8C7FA]" />
                        {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4 text-[#A8C7FA]" />
                        {course.modules.length} Modules
                    </div>
                    </div>

                    <h3 className="text-2xl font-bold text-[#E3E3E3] mb-3">{course.title}</h3>
                    <p className="text-[#C4C7C5] mb-8 leading-relaxed flex-grow">
                    {course.description}
                    </p>

                    <div className="border-t border-[#444746] pt-6 flex items-center justify-between">
                    <div>
                        {enrolled ? (
                             <span className="text-lg font-bold text-[#6DD58C]">Owned</span>
                        ) : (
                             <span className="text-2xl font-bold text-[#E3E3E3]">₦{course.price.toLocaleString()}</span>
                        )}
                    </div>
                    <Button 
                        onClick={() => navigate(enrolled ? `/classroom/${course.id}` : `/training/${course.id}`)} 
                        icon={enrolled ? PlayCircle : ArrowRight}
                        variant={enrolled ? 'primary' : 'primary'}
                        className={enrolled ? 'bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3]' : ''}
                    >
                        {enrolled ? 'Continue Learning' : 'View Details'}
                    </Button>
                    </div>
                </div>
                </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};