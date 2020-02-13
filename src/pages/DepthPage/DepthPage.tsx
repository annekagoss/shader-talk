import * as React from 'react';
import Section from '../../components/Section/Section';
import BaseCanvas from '../../components/BaseCanvas/BaseCanvas';
import DepthCanvas from '../../components/DepthCanvas/DepthCanvas';
import ShaderText from '../../components/ShaderText/ShaderText';
import Inputs from '../../components/Inputs/Inputs';
import depthFragmentShader from '../../../lib/gl/shaders/depth.frag';
import baseVertexShader from '../../../lib/gl/shaders/base.vert';
import depthVertexShader from '../../../lib/gl/shaders/depth.vert';
import {BASE_UNIFORMS} from '../../utils/general';
import {UNIFORM_TYPE, Vector2, UniformSetting, Vector3} from '../../../types';

import styles from './DepthPage.module.scss';

interface Props {
	isActive: boolean;
}

const BASE_MESH_UNIFORMS: UniformSetting[] = [
	...BASE_UNIFORMS,
	{
		defaultValue: 0,
		name: 'uTime',
		readonly: true,
		type: UNIFORM_TYPE.FLOAT_1,
		value: 0
	}
];

const CUBE_VERTEX_POSITIONS: Vector3[] = [
	// Face 1
	// Triangle 1
	{x: -1, y: -1, z: -1},
	{x: -1, y: -1, z: 1},
	{x: -1, y: 1, z: 1},
	// Triangle 2
	{x: -1, y: -1, z: -1},
	{x: -1, y: 1, z: 1},
	{x: -1, y: 1, z: -1},
	// Face 2
	// Triangle 1
	{x: 1, y: 1, z: -1},
	{x: -1, y: -1, z: -1},
	{x: -1, y: 1, z: -1},
	// Triangle 2
	{x: 1, y: 1, z: -1},
	{x: 1, y: -1, z: -1},
	{x: -1, y: -1, z: -1},
	// Face 3
	// Triangle 1
	{x: 1, y: -1, z: 1},
	{x: -1, y: -1, z: -1},
	{x: 1, y: -1, z: -1},
	// Triangle 2
	{x: 1, y: -1, z: 1},
	{x: -1, y: -1, z: 1},
	{x: -1, y: -1, z: -1},
	// Face 4
	// Triangle 1
	{x: 1, y: 1, z: 1},
	{x: 1, y: -1, z: -1},
	{x: 1, y: 1, z: -1},
	// Triangle 2
	{x: 1, y: -1, z: -1},
	{x: 1, y: 1, z: 1},
	{x: 1, y: -1, z: 1},
	// Face 5
	// Triangle 1
	{x: 1, y: 1, z: 1},
	{x: 1, y: 1, z: -1},
	{x: -1, y: 1, z: -1},
	// Triangle 2
	{x: 1, y: 1, z: 1},
	{x: -1, y: 1, z: -1},
	{x: -1, y: 1, z: 1},
	// Face 6
	// Triangle 1
	{x: -1, y: 1, z: 1},
	{x: -1, y: -1, z: 1},
	{x: 1, y: -1, z: 1},
	// Triangle 2
	{x: 1, y: 1, z: 1},
	{x: -1, y: 1, z: 1},
	{x: 1, y: -1, z: 1}
];

const CUBE_ROTATION_DELTA: Vector3 = {x: 0.001, y: 0.01, z: 0};

const DepthPage = ({isActive}: Props) => {
	const meshUniforms = React.useRef<UniformSetting[]>(BASE_MESH_UNIFORMS);
	const pageMousePosRef: React.MutableRefObject<Vector2> = React.useRef<Vector2>({
		x: 0.5,
		y: 0.5
	});
	const [attributes, setAttributes] = React.useState<any[]>([]);

	if (!isActive) return <></>;

	return (
		<div className={styles.page}>
			<Section title='2.0: Mesh' notes={``}>
				<DepthCanvas
					fragmentShader={depthFragmentShader}
					vertexShader={depthVertexShader}
					uniforms={meshUniforms}
					setAttributes={setAttributes}
					vertexPositions={CUBE_VERTEX_POSITIONS}
					rotationDelta={CUBE_ROTATION_DELTA}
				/>
				<ShaderText fragmentShader={depthFragmentShader} vertexShader={depthVertexShader} />
				<Inputs attributes={attributes} uniforms={meshUniforms} pageMousePosRef={pageMousePosRef} />
			</Section>
		</div>
	);
};

export default DepthPage;