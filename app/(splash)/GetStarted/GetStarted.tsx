"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lock, Cpu, Zap } from "lucide-react";

export const GetStarted = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Sophisticated grid system
    class GridNode {
      x: number;
      y: number;
      baseY: number;
      phase: number;
      amplitude: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.phase = Math.random() * Math.PI * 2;
        this.amplitude = 20 + Math.random() * 30;
      }

      update(time: number, mouseX: number, mouseY: number) {
        const dx = this.x - mouseX;
        const dy = this.baseY - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 300;
        
        if (distance < maxDistance) {
          const influence = 1 - distance / maxDistance;
          this.y = this.baseY + Math.sin(time * 0.001 + this.phase) * this.amplitude * 0.3 - influence * 40;
        } else {
          this.y = this.baseY + Math.sin(time * 0.001 + this.phase) * this.amplitude * 0.3;
        }
      }
    }

    // Create grid
    const cols = 25;
    const rows = 15;
    const nodes: GridNode[][] = [];
    
    for (let i = 0; i < rows; i++) {
      nodes[i] = [];
      for (let j = 0; j < cols; j++) {
        const x = (canvas.width / (cols - 1)) * j;
        const y = (canvas.height / (rows - 1)) * i;
        nodes[i][j] = new GridNode(x, y);
      }
    }

    let animationTime = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationTime += 16;

      // Update nodes
      nodes.forEach((row) => {
        row.forEach((node) => {
          node.update(animationTime, mousePosition.x, mousePosition.y);
        });
      });

      // Draw grid lines with subtle color gradient
      ctx.lineWidth = 1;

      // Horizontal lines
      for (let i = 0; i < rows; i++) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "rgba(170, 196, 245, 0.1)"); // #AAC4F5
        gradient.addColorStop(0.5, "rgba(255, 242, 198, 0.12)"); // #FFF2C6
        gradient.addColorStop(1, "rgba(170, 196, 245, 0.1)"); // #AAC4F5
        ctx.strokeStyle = gradient;
        
        ctx.beginPath();
        for (let j = 0; j < cols; j++) {
          const node = nodes[i][j];
          if (j === 0) {
            ctx.moveTo(node.x, node.y);
          } else {
            ctx.lineTo(node.x, node.y);
          }
        }
        ctx.stroke();
      }

      // Vertical lines
      for (let j = 0; j < cols; j++) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "rgba(170, 196, 245, 0.1)"); // #AAC4F5
        gradient.addColorStop(0.5, "rgba(255, 242, 198, 0.12)"); // #FFF2C6
        gradient.addColorStop(1, "rgba(170, 196, 245, 0.1)"); // #AAC4F5
        ctx.strokeStyle = gradient;
        
        ctx.beginPath();
        for (let i = 0; i < rows; i++) {
          const node = nodes[i][j];
          if (i === 0) {
            ctx.moveTo(node.x, node.y);
          } else {
            ctx.lineTo(node.x, node.y);
          }
        }
        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [mousePosition]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white dark:bg-neutral-950">
      {/* Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-10 opacity-40 dark:opacity-20"
      />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-neutral-950/50 dark:to-neutral-950" />
      
      {/* Subtle color accents */}
      <div className="absolute left-0 top-1/4 -z-10 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(170, 196, 245, 0.08)' }} />
      <div className="absolute right-0 top-1/3 -z-10 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255, 242, 198, 0.12)' }} />
      <div className="absolute bottom-1/4 left-1/3 -z-10 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(170, 196, 245, 0.06)' }} />

      {/* Hero Section */}
      <div className="container relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div 
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm"
              style={{ 
                borderColor: 'rgba(170, 196, 245, 0.3)',
                background: 'linear-gradient(to right, rgba(170, 196, 245, 0.15), rgba(255, 242, 198, 0.15))',
                color: 'rgb(60, 80, 120)'
              }}
            >
              Agentic Payments Hackathon @ Y Combinator
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-center text-5xl font-semibold leading-[1.1] tracking-tight text-neutral-900 dark:text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Invoice-Backed
            <br />
            <span 
              className="bg-clip-text text-transparent"
              style={{ 
                backgroundImage: 'linear-gradient(to right, #AAC4F5, #FFF2C6, #AAC4F5)'
              }}
            >
              Lending for AI Agents
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-12 max-w-2xl text-center text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-xl">
            Autonomous agents executing real-world finance through Stripe funding, 
            Locus payments, and Base smart contracts. Built by Team Durin.
          </p>

          {/* CTA Buttons */}
          <div className="mb-20 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              asChild 
              size="lg" 
              className="group h-12 min-w-[180px] rounded-full px-8 text-base font-medium shadow-lg transition-all hover:shadow-xl"
              style={{
                background: 'linear-gradient(to right, #AAC4F5, #8BAAE8)',
                color: '#1a1a1a',
                boxShadow: '0 10px 25px -5px rgba(170, 196, 245, 0.3)'
              }}
            >
              <Link href="/signin" className="flex items-center">
                Launch Demo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="h-12 min-w-[180px] rounded-full border-neutral-300 bg-transparent px-8 text-base font-medium text-neutral-900 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-900"
            >
              <Link href="https://github.com" target="_blank">
                View on GitHub
              </Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 sm:grid-cols-3">
            <Card 
              className="group bg-white/80 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:bg-neutral-900/80"
              style={{ 
                borderColor: 'rgba(170, 196, 245, 0.3)',
                borderWidth: '1px'
              }}
            >
              <CardContent className="flex flex-col items-start gap-4 p-8">
                <div 
                  className="rounded-2xl p-3 transition-all"
                  style={{ 
                    background: 'linear-gradient(to bottom right, rgba(170, 196, 245, 0.15), rgba(170, 196, 245, 0.05))'
                  }}
                >
                  <Lock className="h-6 w-6" style={{ color: '#6B8BC3' }} />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                    Trustless Escrow
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Smart contracts on Base L2 manage invoice NFTs and loan settlement with complete transparency.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group bg-white/80 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:bg-neutral-900/80"
              style={{ 
                borderColor: 'rgba(255, 242, 198, 0.4)',
                borderWidth: '1px'
              }}
            >
              <CardContent className="flex flex-col items-start gap-4 p-8">
                <div 
                  className="rounded-2xl p-3 transition-all"
                  style={{ 
                    background: 'linear-gradient(to bottom right, rgba(255, 242, 198, 0.2), rgba(255, 242, 198, 0.08))'
                  }}
                >
                  <Cpu className="h-6 w-6" style={{ color: '#C9A961' }} />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                    Agent Economy
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    AI agents autonomously negotiate, analyze credit, and execute loans without human intervention.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group bg-white/80 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:bg-neutral-900/80"
              style={{ 
                borderColor: 'rgba(170, 196, 245, 0.3)',
                borderWidth: '1px'
              }}
            >
              <CardContent className="flex flex-col items-start gap-4 p-8">
                <div 
                  className="rounded-2xl p-3 transition-all"
                  style={{ 
                    background: 'linear-gradient(to bottom right, rgba(170, 196, 245, 0.15), rgba(255, 242, 198, 0.1))'
                  }}
                >
                  <Zap className="h-6 w-6" style={{ color: '#8BAAE8' }} />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                    Instant Liquidity
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Convert locked receivables to immediate capital via Locus payments infrastructure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="container relative z-10 border-t border-neutral-200 px-6 py-16 dark:border-neutral-800 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
            Built with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            <div className="text-base font-medium text-neutral-400 transition-colors hover:text-neutral-900 dark:hover:text-white">
              Stripe Connect
            </div>
            <div className="text-base font-medium text-neutral-400 transition-colors hover:text-neutral-900 dark:hover:text-white">
              Locus
            </div>
            <div className="text-base font-medium text-neutral-400 transition-colors hover:text-neutral-900 dark:hover:text-white">
              Base L2
            </div>
            <div className="text-base font-medium text-neutral-400 transition-colors hover:text-neutral-900 dark:hover:text-white">
              Anthropic SDK
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
