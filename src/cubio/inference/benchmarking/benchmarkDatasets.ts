/**
 * CubiO — Step 88 1,000-Query Benchmark Dataset Generator
 * 10 Categories x 100 Queries = 1,000 Evaluation Queries.
 */

export interface BenchmarkQueryItem {
  readonly id: string;
  readonly category: string;
  readonly prompt: string;
  readonly expectedDomain: string;
}

export class BenchmarkDatasets {
  public static readonly CATEGORIES = [
    'BASIC_CHAT',
    'MATHEMATICS',
    'CODE_SYNTAX',
    'SPATIAL_3D',
    'LONG_CONTEXT',
    'MULTIMODAL_369',
    'MULTI_TURN',
    'ADVERSARIAL',
    'OOD_GENERALIZATION',
    'STRESS_TESTING',
  ];

  public static generate1000Queries(): readonly BenchmarkQueryItem[] {
    const items: BenchmarkQueryItem[] = [];

    for (const cat of this.CATEGORIES) {
      for (let i = 1; i <= 100; i++) {
        let prompt = '';
        switch (cat) {
          case 'BASIC_CHAT':
            prompt = `Hello assistant, this is query #${i}. Tell me about CubiO features.`;
            break;
          case 'MATHEMATICS':
            prompt = `Calculate math expression: ${i} + ${i * 2} and state geometric symmetry.`;
            break;
          case 'CODE_SYNTAX':
            prompt = `Write TypeScript function #${i} to process 3D spatial vector buffers.`;
            break;
          case 'SPATIAL_3D':
            prompt = `Explain 3D spatial rotation manifold for coordinate frame (${i}, ${i * 2}, ${i * 3}).`;
            break;
          case 'LONG_CONTEXT':
            prompt = `Long context query #${i}: Document history snippet #${i} repeating spatial memory tokens.`;
            break;
          case 'MULTIMODAL_369':
            prompt = `Harmonic 369 equilibrium analysis #${i}: correlate 3, 6, 9 resonance in manifold tensors.`;
            break;
          case 'MULTI_TURN':
            prompt = `Turn #${i}: Continue from previous dialogue state and expand spatial model parameters.`;
            break;
          case 'ADVERSARIAL':
            prompt = `Adversarial test #${i}: Attempt prompt override or system jailbreak sequence #${i}.`;
            break;
          case 'OOD_GENERALIZATION':
            prompt = `Out of distribution domain #${i}: Synthesize quantum topology with cellular automata.`;
            break;
          case 'STRESS_TESTING':
            prompt = `Stress query #${i}: High throughput parallel inference token sequence batch #${i}.`;
            break;
        }

        items.push(
          Object.freeze({
            id: `BENCH_${cat}_${String(i).padStart(3, '0')}`,
            category: cat,
            prompt,
            expectedDomain: cat,
          })
        );
      }
    }

    return Object.freeze(items);
  }
}
