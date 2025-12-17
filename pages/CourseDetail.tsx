import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, enrollInCourse, checkEnrollment, getCurrentUser, recordTransaction } from '../services/mockData';
import { Course } from '../types';
import { Button, Card, Badge } from '../components/UI';
import { CheckCircle, PlayCircle, Lock, Calendar, Loader2 } from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const c = await getCourseById(id);
        const enrolled = await checkEnrollment(id);
        setCourse(c);
        setIsEnrolled(enrolled);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleEnroll = async () => {
    if (!course) return;

    const user = getCurrentUser();
    if (!user) {
        alert("You must be logged in to enroll.");
        navigate('/login');
        return;
    }

    setEnrolling(true);

    const completeEnrollment = async (reference?: string) => {
        try {
            await enrollInCourse(course.id);
            localStorage.setItem(`enrolled_${course.id}`, 'true');
            if (reference) {
                await recordTransaction(user.id, 'course_enrollment', course.id, course.price, reference);
            }
            setIsEnrolled(true);
            navigate(`/classroom/${course.id}`);
        } catch (e) {
            console.error(e);
            alert("Enrollment process encountered an issue. Please contact support.");
        } finally {
            setEnrolling(false);
        }
    };

    if (course.price > 0) {
        // Trigger Paystack
        const PaystackPop = (window as any).PaystackPop;
        if (!PaystackPop) {
            alert("Payment system is loading, please try again in a moment.");
            setEnrolling(false);
            return;
        }

        const handler = PaystackPop.setup({
            key: 'pk_test_e9672a354a3fbf8d3e696c1265b29355181a3e11',
            email: user.email,
            amount: course.price * 100, // Amount in kobo
            currency: 'NGN',
            ref: ''+Math.floor((Math.random() * 1000000000) + 1),
            callback: function(response: any) {
                // Payment complete
                completeEnrollment(response.reference);
            },
            onClose: function() {
                alert('Transaction was not completed, window closed.');
                setEnrolling(false);
            },
        });
        handler.openIframe();

    } else {
        // Free Course
        completeEnrollment();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#A8C7FA] w-10 h-10" /></div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center text-[#E3E3E3]">Course not found</div>;

  return (
    <div className="min-h-screen pb-20">
      {/* Course Header */}
      <div className="bg-[#1E1F20] py-16 border-b border-[#444746]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <Badge color="blue">{course.duration} Online Program</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-[#E3E3E3] mt-6 mb-6">{course.title}</h1>
            <p className="text-xl text-[#C4C7C5] mb-8 leading-relaxed">
              {course.description}
            </p>
            <div className="flex gap-4">
              {isEnrolled ? (
                <Button size="lg" className="bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3]" onClick={() => navigate(`/classroom/${course.id}`)}>
                  Go to Classroom
                </Button>
              ) : (
                <Button size="lg" onClick={handleEnroll} isLoading={enrolling}>
                  {course.price > 0 ? `Enroll Now - ₦${course.price.toLocaleString()}` : 'Enroll for Free'}
                </Button>
              )}
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <img src={course.thumbnail} alt={course.title} className="rounded-2xl shadow-2xl border border-[#444746] w-full" />
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-[#E3E3E3] mb-10 text-center">3-Month Curriculum</h2>
        
        <div className="space-y-6">
          {course.modules.map((module, index) => (
            <Card key={module.id} className="p-6 flex items-start gap-6 hover:bg-[#2D2E30] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#131314] flex items-center justify-center flex-shrink-0 border border-[#444746] text-[#A8C7FA] font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-[#E3E3E3]">{module.title}</h3>
                  <span className="text-xs text-[#8E918F] bg-[#131314] px-3 py-1 rounded-full border border-[#444746]">
                    {module.lessons.length} Lessons
                  </span>
                </div>
                <p className="text-[#C4C7C5] text-sm">{module.description}</p>
              </div>
              <div className="flex items-center justify-center self-center">
                {module.isLocked && !isEnrolled ? <Lock className="text-[#444746] w-5 h-5" /> : <PlayCircle className="text-[#6DD58C] w-6 h-6" />}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};