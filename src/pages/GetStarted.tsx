import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useMemo, useState } from "react";
import { 
  Heart, 
  Calendar, 
  User, 
  MapPin,
  Baby,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

type CalculationMethod = "dueDate" | "lastMenstrualPeriod";

interface PregnancyProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  calculationMethod: CalculationMethod;
  date: string;
  pregnancyNumber: string;
  location: string;
  hospital: string;
  healthConditions: string[];
  language: string;
  reminders: {
    appointments: boolean;
    medications: boolean;
    tips: boolean;
    emergency: boolean;
  };
  communicationMethod: string;
  agreedToTerms: boolean;
}

const HEALTH_CONDITIONS = [
  "Diabetes",
  "High Blood Pressure",
  "Previous Complications",
  "Other",
] as const;

const LANGUAGES = ["english", "swahili", "kikuyu", "luo"] as const;
const COUNTIES = ["nairobi", "mombasa", "kisumu", "nakuru", "other"] as const;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const GetStarted = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  const { isSignedIn, getToken } = useAuth();

  const [profile, setProfile] = useState<PregnancyProfileInput>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    calculationMethod: "dueDate",
    date: "",
    pregnancyNumber: "",
    location: "",
    hospital: "",
    healthConditions: [],
    language: "",
    reminders: {
      appointments: true,
      medications: true,
      tips: true,
      emergency: true,
    },
    communicationMethod: "",
    agreedToTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      setStatus(null);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setStatus(null);
    }
  };

  const toggleHealthCondition = (condition: (typeof HEALTH_CONDITIONS)[number]) => {
    setProfile((prev) => ({
      ...prev,
      healthConditions: prev.healthConditions.includes(condition)
        ? prev.healthConditions.filter((c) => c !== condition)
        : [...prev.healthConditions, condition],
    }));
  };

  const benefits = [
    {
      icon: Calendar,
      title: "Smart Reminders",
      description: "Never miss appointments or medications"
    },
    {
      icon: Heart,
      title: "Health Tracking",
      description: "Monitor your pregnancy progress weekly"
    },
    {
      icon: Baby,
      title: "Baby Development",
      description: "Track your baby's growth milestones"
    }
  ];

  const canSubmit = useMemo(() => {
    return (
      profile.firstName &&
      profile.lastName &&
      profile.email &&
      profile.phone &&
      profile.age &&
      profile.date &&
      profile.pregnancyNumber &&
      profile.location &&
      profile.language &&
      profile.communicationMethod &&
      profile.agreedToTerms
    );
  }, [profile]);

  const handleComplete = async () => {
    if (!isSignedIn) {
      setStatus({
        type: "error",
        message: "Please sign in with your MamaCare account before completing setup.",
      });
      return;
    }

    if (!canSubmit) {
      setStatus({
        type: "error",
        message: "Kindly complete all required fields and agree to the terms.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to retrieve authentication token.");
      }

      const payload = {
        ...profile,
        reminders: {
          appointments: profile.reminders.appointments,
          medications: profile.reminders.medications,
          tips: profile.reminders.tips,
          emergency: profile.reminders.emergency,
        },
        ...(profile.calculationMethod === "dueDate"
          ? { dueDate: profile.date }
          : { lastMenstrualPeriod: profile.date }),
      };

      const response = await fetch(`${API_BASE_URL}/api/pregnancy-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save your profile.");
      }

      setStatus({
        type: "success",
        message: "Your pregnancy profile has been saved successfully!",
      });
    } catch (error) {
      console.error("Error saving pregnancy profile:", error);
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setStatus({
        type: "error",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-blue/5">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border/40 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 bg-gradient-maternal rounded-full flex items-center justify-center mr-3">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">MamaCare</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link>
            <Link to="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">Support</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Progress Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Welcome to Your
              <span className="text-primary block">Pregnancy Journey</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Let's set up your personalized pregnancy tracker in just a few steps
            </p>
            
            <div className="max-w-md mx-auto mb-8">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">Step {step} of {totalSteps}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-4">
              {status && (
                <div
                  className={`flex items-center space-x-2 rounded-lg border px-4 py-3 ${
                    status.type === "success"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-red-300 bg-red-50 text-red-900"
                  }`}
                >
                  {status.type === "success" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <p className="text-sm font-medium">{status.message}</p>
                </div>
              )}

              <Card className="shadow-elegant">
                <CardContent className="p-8">
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-maternal rounded-full flex items-center justify-center mx-auto mb-4">
                          <User className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Personal Information</h2>
                        <p className="text-muted-foreground">Tell us about yourself</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="Enter your first name"
                            value={profile.firstName}
                            onChange={(e) =>
                              setProfile((prev) => ({ ...prev, firstName: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Enter your last name"
                            value={profile.lastName}
                            onChange={(e) =>
                              setProfile((prev) => ({ ...prev, lastName: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={profile.email}
                          onChange={(e) =>
                            setProfile((prev) => ({ ...prev, email: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+254 700 123 456"
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile((prev) => ({ ...prev, phone: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Select
                          value={profile.age}
                          onValueChange={(value) =>
                            setProfile((prev) => ({ ...prev, age: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your age range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18-24">18-24 years</SelectItem>
                            <SelectItem value="25-29">25-29 years</SelectItem>
                            <SelectItem value="30-34">30-34 years</SelectItem>
                            <SelectItem value="35-39">35-39 years</SelectItem>
                            <SelectItem value="40+">40+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-maternal rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Pregnancy Details</h2>
                        <p className="text-muted-foreground">Help us create your timeline</p>
                      </div>

                      <div>
                        <Label>How would you like to calculate your due date?</Label>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          {(["dueDate", "lastMenstrualPeriod"] as CalculationMethod[]).map((method) => (
                            <Card
                              key={method}
                              className={`cursor-pointer border-2 transition-colors ${
                                profile.calculationMethod === method
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-primary"
                              }`}
                              onClick={() =>
                                setProfile((prev) => ({ ...prev, calculationMethod: method }))
                              }
                            >
                              <CardContent className="p-4 text-center">
                                {method === "dueDate" ? (
                                  <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                                ) : (
                                  <Heart className="w-8 h-8 mx-auto mb-2 text-primary" />
                                )}
                                <h3 className="font-semibold">
                                  {method === "dueDate" ? "Due Date" : "Last Period"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {method === "dueDate" ? "I know my due date" : "Last menstrual period"}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="date">Select Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={profile.date}
                          onChange={(e) =>
                            setProfile((prev) => ({ ...prev, date: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label>Is this your first pregnancy?</Label>
                        <Select
                          value={profile.pregnancyNumber}
                          onValueChange={(value) =>
                            setProfile((prev) => ({ ...prev, pregnancyNumber: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="first">Yes, first pregnancy</SelectItem>
                            <SelectItem value="second">Second pregnancy</SelectItem>
                            <SelectItem value="third">Third pregnancy</SelectItem>
                            <SelectItem value="more">More than three</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-maternal rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPin className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Health & Location</h2>
                        <p className="text-muted-foreground">Help us personalize your experience</p>
                      </div>

                      <div>
                        <Label htmlFor="location">Location (County)</Label>
                        <Select
                          value={profile.location}
                          onValueChange={(value) =>
                            setProfile((prev) => ({ ...prev, location: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your county" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTIES.map((county) => (
                              <SelectItem key={county} value={county}>
                                {county.charAt(0).toUpperCase() + county.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="hospital">Preferred Hospital/Clinic</Label>
                        <Input
                          id="hospital"
                          placeholder="Enter hospital or clinic name"
                          value={profile.hospital}
                          onChange={(e) =>
                            setProfile((prev) => ({ ...prev, hospital: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label>Health Conditions (Optional)</Label>
                        <div className="space-y-3 mt-3">
                          {HEALTH_CONDITIONS.map((condition) => (
                            <div key={condition} className="flex items-center space-x-2">
                              <Checkbox
                                id={condition}
                                checked={profile.healthConditions.includes(condition)}
                                onCheckedChange={() => toggleHealthCondition(condition)}
                              />
                              <Label htmlFor={condition}>{condition}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Preferred Language</Label>
                        <Select
                          value={profile.language}
                          onValueChange={(value) =>
                            setProfile((prev) => ({ ...prev, language: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {lang.charAt(0).toUpperCase() + lang.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-maternal rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Almost Done!</h2>
                        <p className="text-muted-foreground">Choose your notification preferences</p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Reminder Preferences</h3>
                        {([
                          { key: "appointments", label: "Appointment reminders" },
                          { key: "medications", label: "Medication reminders" },
                          { key: "tips", label: "Weekly health tips" },
                          { key: "emergency", label: "Emergency notifications" },
                        ] as const).map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={label}
                              checked={profile.reminders[key]}
                              onCheckedChange={(checked) =>
                                setProfile((prev) => ({
                                  ...prev,
                                  reminders: {
                                    ...prev.reminders,
                                    [key]: Boolean(checked),
                                  },
                                }))
                              }
                            />
                            <Label htmlFor={label}>{label}</Label>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Communication Method</h3>
                        <Select
                          value={profile.communicationMethod}
                          onValueChange={(value) =>
                            setProfile((prev) => ({ ...prev, communicationMethod: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="How would you like to receive reminders?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="app">App notifications only (Free)</SelectItem>
                            <SelectItem value="sms">SMS + App notifications (Premium)</SelectItem>
                            <SelectItem value="email">Email + App notifications (Free)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border rounded-lg p-4 bg-primary/5">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="terms"
                            checked={profile.agreedToTerms}
                            onCheckedChange={(checked) =>
                              setProfile((prev) => ({
                                ...prev,
                                agreedToTerms: Boolean(checked),
                              }))
                            }
                          />
                          <div className="text-sm">
                            <Label htmlFor="terms">
                              I agree to the{" "}
                              <Link to="/terms-of-service" className="text-primary hover:underline">
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link to="/privacy-policy" className="text-primary hover:underline">
                                Privacy Policy
                              </Link>
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    <Button 
                      variant="outline" 
                      onClick={prevStep}
                      disabled={step === 1 || isSubmitting}
                    >
                      Previous
                    </Button>
                    <Button 
                      onClick={step === totalSteps ? handleComplete : nextStep}
                      disabled={isSubmitting || (step === totalSteps && !canSubmit)}
                      variant="maternal"
                    >
                      {step === totalSteps ? (
                        isSubmitting ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          <>
                            Complete Setup
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )
                      ) : (
                        <>
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Benefits Sidebar */}
            <div className="space-y-6">
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">Why Choose MamaCare?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-maternal rounded-full flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{benefit.title}</h4>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-gentle">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
                  <p className="text-sm text-muted-foreground">Mothers trust MamaCare</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;